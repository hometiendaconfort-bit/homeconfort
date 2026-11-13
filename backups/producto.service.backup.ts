
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import {
  Observable,
  of,
  from,
  throwError
} from 'rxjs';

import {
  map,
  tap,
  shareReplay,
  finalize,
  catchError
} from 'rxjs/operators';

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DataSource } from '../config/data-source';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private cache: any[] | null = null;

  private solicitud$: Observable<any[]> | null = null;

  private readonly STORAGE_KEY = 'homeconfort_productos_cache';

  private esNavegador: boolean;

  productoParaVolver: number | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.esNavegador = isPlatformBrowser(this.platformId);
  }

  getProductos(): Observable<any[]> {

    // Si ya tenemos datos consultados correctamente en memoria,
    // reutilizarlos.
    if (this.cache !== null) {
      return of(this.cache);
    }

    // Evitar consultas duplicadas.
    if (this.solicitud$ !== null) {
      return this.solicitud$;
    }

    // Comprobar si Firebase está habilitado.
    if (!DataSource.firebase) {

      const productosGuardados = this.cargarCacheLocal();

      if (productosGuardados !== null) {
        return of(productosGuardados);
      }

      return throwError(
        () => new Error(
          'La fuente de datos Firebase no está habilitada.'
        )
      );
    }

    // Consultar Firebase antes de entregar la caché local.
    const consultaFirebase$ = from(
      getDocs(collection(db, 'productos'))
    ).pipe(

      map(snapshot =>
        snapshot.docs.map(documento => ({
          ...documento.data(),
          docId: documento.id
        }))
      ),

      tap((productos: any[]) => {

        // Guardar los datos actuales en memoria.
        this.cache = productos;

        // Actualizar la caché del navegador.
        this.guardarCacheLocal(productos);

        console.log(
          'Productos recibidos de Firebase:',
          productos
        );

        console.log(
          'Total de productos:',
          productos.length
        );
      }),

      catchError((error) => {

        console.error(
          'Error al cargar productos desde Firebase:',
          error
        );

        // Utilizar la caché únicamente si Firebase falla.
        const productosGuardados = this.cargarCacheLocal();

        if (productosGuardados !== null) {
          return of(productosGuardados);
        }

        return throwError(() => error);
      })
    );

    // Compartir una única consulta entre los componentes.
    this.solicitud$ = consultaFirebase$.pipe(

      finalize(() => {
        this.solicitud$ = null;
      }),

      shareReplay({
        bufferSize: 1,
        refCount: false
      })
    );

    return this.solicitud$;
  }

  // Recuperar productos guardados en el navegador.
  private cargarCacheLocal(): any[] | null {

    if (!this.esNavegador) {
      return null;
    }

    try {

      const datos = localStorage.getItem(this.STORAGE_KEY);

      if (!datos) {
        return null;
      }

      const productos: unknown = JSON.parse(datos);

      if (Array.isArray(productos)) {
        return productos;
      }

      return null;

    } catch (error) {

      console.warn(
        'Error al recuperar la caché de productos:',
        error
      );

      return null;
    }
  }

  // Guardar productos en el navegador.
  private guardarCacheLocal(productos: any[]): void {

    if (!this.esNavegador) {
      return;
    }

    try {

      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(productos)
      );

    } catch (error) {

      console.warn(
        'Error al guardar la caché de productos:',
        error
      );
    }
  }

  // Limpiar caché después de crear, editar o eliminar productos.
  invalidarCache(): void {

    this.cache = null;
    this.solicitud$ = null;

    if (this.esNavegador) {

      try {
        localStorage.removeItem(this.STORAGE_KEY);
      } catch (error) {

        console.warn(
          'Error al limpiar la caché de productos:',
          error
        );
      }
    }
  }
}
