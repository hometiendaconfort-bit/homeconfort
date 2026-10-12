import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, map } from 'rxjs';

import { collection, getDocs } from 'firebase/firestore';

import { db } from '../config/firebase';
import { DataSource } from '../config/data-source';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private url = 'http://localhost:3000/productos';
  private cache: any[] | null = null;
  productoParaVolver: number | null = null;

  constructor(private http: HttpClient) {}

 getProductos(): Observable<any[]> {

  if (this.cache) {
    return of(this.cache);
  }

  // Si estamos usando datos locales
  if (!DataSource.firebase) {

    return this.http.get<any[]>(this.url).pipe(
      tap(data => this.cache = data)
    );

  }

  // Si estamos usando Firebase
  return new Observable<any[]>(observer => {

  getDocs(collection(db, 'productos'))
    .then(snapshot => {

      console.log("Documentos encontrados:", snapshot.size);

      const productos = snapshot.docs.map(doc => ({
        ...doc.data()
      }));

      console.log(productos);

      this.cache = productos;

      observer.next(productos);
      observer.complete();

    })
    .catch(error => {
      console.error("Error Firebase:", error);
      observer.error(error);
    });

});

}
}
