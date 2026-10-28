
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
    quincenal: number | null = null,
    cuotasQuincenales: number | null = null,
    mensual: number | null = null,
    cuotasMensuales: number | null = null,
    vendeQuincenal: boolean = true,
    vendeMensual: boolean = false
  ): Promise<void> {

    const combosRef = collection(db, 'combos');

    await addDoc(combosRef, {
      id,
      nombre,
      imagen,
      baseId,
      colchonId,
      espaldarId,

      // PRECIO ANTIGUO PARA COMPATIBILIDAD
      precio,

      // MODALIDADES DE VENTA
      vendeContado,
      vendeCredito,
      precioContado: vendeContado ? precioContado : null,
      precioCredito: vendeCredito ? precioCredito : null,
      inicial: vendeCredito ? inicial : null,

      // FRECUENCIA QUINCENAL
      vendeQuincenal: vendeCredito ? vendeQuincenal : false,
      quincenal:
        vendeCredito && vendeQuincenal ? quincenal : null,
      cuotasQuincenales:
        vendeCredito && vendeQuincenal ? cuotasQuincenales : null,

      // FRECUENCIA MENSUAL
      vendeMensual: vendeCredito ? vendeMensual : false,
      mensual:
        vendeCredito && vendeMensual ? mensual : null,
      cuotasMensuales:
        vendeCredito && vendeMensual ? cuotasMensuales : null,

      descripcion
    });
  }

  // OBTENER LOS COMBOS
  async obtenerCombo(): Promise<any[]> {
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
    quincenal: number | null = null,
    cuotasQuincenales: number | null = null,
    mensual: number | null = null,
    cuotasMensuales: number | null = null,
    vendeQuincenal: boolean = true,
    vendeMensual: boolean = false
  ): Promise<void> {

    const comboRef = doc(db, 'combos', docId);

    await updateDoc(comboRef, {
      id,
      nombre,
      imagen,
      baseId,
      colchonId,
      espaldarId,

      // PRECIO ANTIGUO PARA COMPATIBILIDAD
      precio,

      // MODALIDADES DE VENTA
      vendeContado,
      vendeCredito,
      precioContado: vendeContado ? precioContado : null,
      precioCredito: vendeCredito ? precioCredito : null,
      inicial: vendeCredito ? inicial : null,

      // FRECUENCIA QUINCENAL
      vendeQuincenal: vendeCredito ? vendeQuincenal : false,
      quincenal:
        vendeCredito && vendeQuincenal ? quincenal : null,
      cuotasQuincenales:
        vendeCredito && vendeQuincenal ? cuotasQuincenales : null,

      // FRECUENCIA MENSUAL
      vendeMensual: vendeCredito ? vendeMensual : false,
      mensual:
        vendeCredito && vendeMensual ? mensual : null,
      cuotasMensuales:
        vendeCredito && vendeMensual ? cuotasMensuales : null,

      descripcion
    });
  }

  // ELIMINAR UN COMBO
  async eliminarCombo(docId: string): Promise<void> {
    const comboRef = doc(db, 'combos', docId);
    await deleteDoc(comboRef);
  }

  productoParaVolver: string | null = null;
}
