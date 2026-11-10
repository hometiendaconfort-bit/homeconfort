
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from } from 'rxjs';
import { map, tap, shareReplay, finalize } from 'rxjs/operators';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { DataSource } from '../config/data-source';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private url = 'http://localhost:3000/productos';

  private cache: any[] | null = null;

  private solicitud$: Observable<any[]> | null = null;

  productoParaVolver: number | null = null;

  constructor(private http: HttpClient) {}

  getProductos(): Observable<any[]> {

    // Si los productos ya están cargados, no consultar nuevamente.
    if (this.cache !== null) {
      return of(this.cache);
    }

    // Si ya existe una consulta en curso, reutilizarla.
    if (this.solicitud$) {
      return this.solicitud$;
    }

    let solicitud: Observable<any[]>;

    if (!DataSource.firebase) {

      solicitud = this.http.get<any[]>(this.url);

    } else {

      solicitud = from(
        getDocs(collection(db, 'productos'))
      ).pipe(
        map(snapshot =>
          snapshot.docs.map(documento => ({
            ...documento.data(),
            docId: documento.id
          }))
        )
      );

    }

    this.solicitud$ = solicitud.pipe(
      tap(productos => {
        this.cache = productos;
      }),
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

  // Permite actualizar el catálogo después de crear,
  // editar o eliminar un producto desde administración.
  invalidarCache(): void {
    this.cache = null;
    this.solicitud$ = null;
  }
}
