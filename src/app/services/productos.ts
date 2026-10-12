import { Injectable } from '@angular/core';
import { addDoc, getDocs, deleteDoc, updateDoc, doc, collection } from 'firebase/firestore';
import { db } from '../config/firebase';

@Injectable({
  providedIn: 'root',
})
export class Productos {

   async agregarProducto(producto: any) {

    const productosRef = collection(db, 'productos');

    await addDoc(productosRef, {
      ...producto
    });
  }

  async obtenerProductos() {

    const productosRef = collection(db, 'productos');
    const snapshot = await getDocs(productosRef);

    return snapshot.docs.map(documento => ({
      docId: documento.id,
      ...documento.data()
    }));
  }

  async eliminarProducto(docId: string) {

    const productoRef = doc(db, 'productos', docId);

    await deleteDoc(productoRef);
  }

  async editarProducto(docId: string, producto: any) {

    const productoRef = doc(db, 'productos', docId);

    await updateDoc(productoRef, {
      ...producto
    });
  } 
}