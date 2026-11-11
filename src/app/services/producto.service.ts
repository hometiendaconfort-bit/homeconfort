
import { Injectable } from '@angular/core';
import { Observable, of, from, throwError } from 'rxjs';
import { map, tap, shareReplay, finalize, catchError } from 'rxjs/operators';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DataSource } from '../config/data-source';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private cache: any[] | null = null;

  private solicitud$: Observable<any[]> | null = null;

  productoParaVolver: number | null = null;

  getProductos(): Observable<any[]> {

    // 1. Si ya tenemos los productos, usamos la caché.
    if (this.cache !== null) {
      return of(this.cache);
    }

    // 2. Si existe una consulta en curso, la reutilizamos.
    if (this.solicitud$ !== null) {
      return this.solicitud$;
    }

    // 3. Consultamos Firebase.
    if (!DataSource.firebase) {
      return throwError(() =>
        new Error('La fuente de datos Firebase no está habilitada.')
      );
    }

    const solicitud = from(
      getDocs(collection(db, 'productos'))
    ).pipe(
      map(snapshot =>
        snapshot.docs.map(documento => ({
          ...documento.data(),
          docId: documento.id
        }))
      ),

      // Guardamos los productos recibidos.
      tap(productos => {
        this.cache = productos;
      }),

      // Si ocurre un error, lo propagamos y permitimos reintentar.
      catchError(error => {
        console.error('Error al cargar los productos:', error);
        return throwError(() => error);
      }),

      // Liberamos la solicitud al finalizar.
      finalize(() => {
        this.solicitud$ = null;
      }),

      // Compartimos la misma consulta entre los suscriptores.
      shareReplay({
        bufferSize: 1,
        refCount: false
      })
    );

    this.solicitud$ = solicitud;

    return solicitud;
  }

  // Limpiar caché después de crear, editar o eliminar productos.
  invalidarCache(): void {
    this.cache = null;
    this.solicitud$ = null;
  }
}
