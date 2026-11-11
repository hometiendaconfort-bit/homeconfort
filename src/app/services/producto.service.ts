
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import {
  Observable,
  of,
  from,
  concat,
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

    // 1. Entregar inmediatamente los productos en memoria.
    if (this.cache !== null) {
      return of<any[]>(this.cache);
    }

    // 2. Recuperar los productos guardados en el navegador.
    this.cargarCacheLocal();

    // 3. Reutilizar una consulta que ya esté en ejecución.
    if (this.solicitud$ !== null) {
      return this.solicitud$;
    }

    // 4. Comprobar si Firebase está habilitado.
    if (!DataSource.firebase) {

      if (this.cache !== null) {
        return of<any[]>(this.cache);
      }

      return throwError(
        () => new Error('La fuente de datos Firebase no está habilitada.')
      );
    }

    // Productos disponibles antes de consultar Firebase.
    const productosIniciales: any[] | null = this.cache;

    // 5. Consultar Firebase.
    const consultaFirebase$: Observable<any[]> = from(
      getDocs(collection(db, 'productos'))
    ).pipe(

      map(snapshot =>
        snapshot.docs.map(documento => ({
          ...documento.data(),
          docId: documento.id
        }))
      ),

      tap((productos: any[]) => {
        this.cache = productos;
        this.guardarCacheLocal(productos);
      }),

      catchError((error): Observable<any[]> => {

        console.error(
          'Error al cargar productos desde Firebase:',
          error
        );

        if (productosIniciales !== null) {
          return of<any[]>(productosIniciales);
        }

        return throwError(() => error);
      })
    );

    // 6. Mostrar primero la caché y después los datos de Firebase.
    const fuente$: Observable<any[]> = productosIniciales !== null
      ? concat<any[]>(
          of<any[]>(productosIniciales),
          consultaFirebase$
        )
      : consultaFirebase$;

    // 7. Compartir la consulta entre los componentes.
    const solicitud: Observable<any[]> = fuente$.pipe(

      finalize(() => {
        this.solicitud$ = null;
      }),

      shareReplay({
        bufferSize: 1,
        refCount: false
      })
    );

    this.solicitud$ = solicitud;

    return solicitud;
  }

  // Recuperar productos guardados en el navegador.
  private cargarCacheLocal(): void {

    if (!this.esNavegador) {
      return;
    }

    try {

      const datos = localStorage.getItem(this.STORAGE_KEY);

      if (!datos) {
        return;
      }

      const productos: unknown = JSON.parse(datos);

      if (Array.isArray(productos)) {
        this.cache = productos;
      }

    } catch (error) {

      console.warn(
        'Error al recuperar la caché de productos:',
        error
      );

      this.cache = null;
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
