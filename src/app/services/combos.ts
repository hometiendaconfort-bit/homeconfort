import { Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

@Injectable({
  providedIn: 'root',
})
export class Combos {

  // AGREGAR UN COMBO
  async agregarCombo(
    id: number,
    nombre: string,
    imagen: string,
    baseId: string,
    colchonId: string,
    espaldarId: string,
    precio: number,
    descripcion: string,
    vendeContado: boolean = true,
    vendeCredito: boolean = false,
    precioContado: number | null = null,
    precioCredito: number | null = null,
    inicial: number | null = null,
    quincenal: number | null = null
  ) {

    const combosRef = collection(db, 'combos');

    await addDoc(combosRef, {
      id,
      nombre,
      imagen,
      baseId,
      colchonId,
      espaldarId,

      // CONSERVO EL PRECIO ANTIGUO
      precio,

      // NUEVOS CAMPOS DE MODALIDADES
      vendeContado,
      vendeCredito,
      precioContado: vendeContado ? precioContado : null,
      precioCredito: vendeCredito ? precioCredito : null,
      inicial: vendeCredito ? inicial : null,
      quincenal: vendeCredito ? quincenal : null,

      descripcion
    });

  }

  // OBTENER LOS COMBOS
  async obtenerCombo() {

    const combosRef = collection(db, 'combos');

    const snapshot = await getDocs(combosRef);

    return snapshot.docs.map(documento => ({
      docId: documento.id,
      ...documento.data()
    }));

  }

  // EDITAR UN COMBO
  async editarCombo(
    docId: string,
    id: number,
    nombre: string,
    imagen: string,
    baseId: string,
    colchonId: string,
    espaldarId: string,
    precio: number,
    descripcion: string,
    vendeContado: boolean = true,
    vendeCredito: boolean = false,
    precioContado: number | null = null,
    precioCredito: number | null = null,
    inicial: number | null = null,
    quincenal: number | null = null
  ) {

    const comboRef = doc(db, 'combos', docId);

    await updateDoc(comboRef, {
      id,
      nombre,
      imagen,
      baseId,
      colchonId,
      espaldarId,

      // CONSERVO EL PRECIO ANTIGUO
      precio,

      // ACTUALIZO LAS MODALIDADES
      vendeContado,
      vendeCredito,
      precioContado: vendeContado ? precioContado : null,
      precioCredito: vendeCredito ? precioCredito : null,
      inicial: vendeCredito ? inicial : null,
      quincenal: vendeCredito ? quincenal : null,

      descripcion
    });

  }

  // ELIMINAR UN COMBO
  async eliminarCombo(docId: string) {

    const comboRef = doc(db, 'combos', docId);

    await deleteDoc(comboRef);

  }

  productoParaVolver: string | null = null;

}