
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

@Injectable({
  providedIn: 'root',
})
export class Productos {

  // AGREGAR UN PRODUCTO
  async agregarProducto(producto: any) {
    const productosRef = collection(db, 'productos');

    await addDoc(productosRef, {
      ...producto
    });
  }

  // OBTENER TODOS LOS PRODUCTOS
  async obtenerProductos() {
    const productosRef = collection(db, 'productos');
    const snapshot = await getDocs(productosRef);

    return snapshot.docs.map(documento => ({
      ...documento.data(),
      docId: documento.id
    }));
  }

  // ELIMINAR UN PRODUCTO
  async eliminarProducto(docId: string) {
    if (!docId) {
      throw new Error('No se recibió el ID del producto.');
    }

    const productoRef = doc(db, 'productos', docId);

    await deleteDoc(productoRef);
  }

  // EDITAR UN PRODUCTO
  async editarProducto(docId: string, producto: any) {
    if (!docId) {
      throw new Error('No se recibió el ID del producto.');
    }

    const productoRef = doc(db, 'productos', docId);

    await updateDoc(productoRef, producto);
  }
}
