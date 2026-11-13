
import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import {
  Observable,
  of,
  from,
  throwError,
  firstValueFrom
} from 'rxjs';

import {
  map,
  tap,
  shareReplay,
  finalize,
  catchError
} from 'rxjs/operators';

import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc
} from 'firebase/firestore';

import { db } from '../config/firebase';
import { DataSource } from '../config/data-source';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private cache: any[] | null = null;
  private solicitud$: Observable<any[]> | null = null;

  private readonly STORAGE_KEY = 'homeconfort_productos_cache';

  private esNavegador = isPlatformBrowser(inject(PLATFORM_ID));

  productoParaVolver: number | null = null;

  // CONSULTAR PRODUCTOS CON CACHÉ
  getProductos(): Observable<any[]> {

    if (this.cache !== null) {
      return of(this.cache);
    }

    if (this.solicitud$ !== null) {
      return this.solicitud$;
    }

    if (!DataSource.firebase) {

      const productosGuardados = this.cargarCacheLocal();

      if (productosGuardados !== null) {
        this.cache = productosGuardados;
        return of(productosGuardados);
      }

      return throwError(
        () => new Error(
          'La fuente de datos Firebase no está habilitada.'
        )
      );
    }

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

        this.cache = productos;
        this.guardarCacheLocal(productos);

        console.log('Productos recibidos de Firebase:', productos);
        console.log('Total de productos:', productos.length);
      }),

      catchError(error => {

        console.error(
          'Error al cargar productos desde Firebase:',
          error
        );

        const productosGuardados = this.cargarCacheLocal();

        if (productosGuardados !== null) {
          this.cache = productosGuardados;
          return of(productosGuardados);
        }

        return throwError(() => error);
      })
    );

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

  // CONSULTAR PRODUCTOS PARA ADMINISTRACIÓN Y COMBOS
  async obtenerProductos(): Promise<any[]> {

    return await firstValueFrom(this.getProductos());
  }

  // AGREGAR PRODUCTO
  async agregarProducto(producto: any) {

    const resultado = await addDoc(
      collection(db, 'productos'),
      producto
    );

    this.invalidarCache();

    return resultado;
  }

  // EDITAR PRODUCTO
  async editarProducto(
    docId: string,
    producto: any
  ): Promise<void> {

    if (!docId) {
      throw new Error('No se recibió el ID del producto.');
    }

    await updateDoc(
      doc(db, 'productos', docId),
      producto
    );

    this.invalidarCache();
  }

  // ELIMINAR PRODUCTO
  async eliminarProducto(docId: string): Promise<void> {

    if (!docId) {
      throw new Error('No se recibió el ID del producto.');
    }

    await deleteDoc(
      doc(db, 'productos', docId)
    );

    this.invalidarCache();
  }

  // RECUPERAR CACHÉ LOCAL
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

      return Array.isArray(productos) ? productos : null;

    } catch (error) {

      console.warn(
        'Error al recuperar la caché de productos:',
        error
      );

      return null;
    }
  }

  // GUARDAR CACHÉ LOCAL
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

  // INVALIDAR CACHÉ
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
