
import { Injectable } from '@angular/core';
import {
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  collection
} from 'firebase/firestore';

import { db } from '../config/firebase';
import { ProductosService } from './producto.service';

@Injectable({
  providedIn: 'root'
})
export class Productos {

  constructor(
    private productosService: ProductosService
  ) {}

  async agregarProducto(producto: any) {

    const productosRef = collection(db, 'productos');

    const resultado = await addDoc(productosRef, {
      ...producto
    });

    this.productosService.invalidarCache();

    return resultado;
  }

  async obtenerProductos() {

    const productosRef = collection(db, 'productos');

    const snapshot = await getDocs(productosRef);

    return snapshot.docs.map(documento => ({
      ...documento.data(),
      docId: documento.id
    }));
  }

  async eliminarProducto(docId: string) {

    if (!docId) {
      throw new Error('No se recibió el ID del producto.');
    }

    await deleteDoc(
      doc(db, 'productos', docId)
    );

    this.productosService.invalidarCache();
  }

  async editarProducto(docId: string, producto: any) {

    if (!docId) {
      throw new Error('No se recibió el ID del producto.');
    }

    await updateDoc(
      doc(db, 'productos', docId),
      producto
    );

    this.productosService.invalidarCache();
  }
}
