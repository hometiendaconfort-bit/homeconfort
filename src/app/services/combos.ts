
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

interface ColoresCombo {
  baseColor: string;
  colchonColor: string;
  espaldarColor: string;
}

@Injectable({
  providedIn: 'root',
})
export class Combos {

  // =========================
  // AGREGAR COMBO
  // =========================

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
    vendeMensual: boolean = false,
    colores: ColoresCombo = {
      baseColor: '',
      colchonColor: '',
      espaldarColor: ''
    },
    incluyeAlmohadas: boolean = false,
    cantidadAlmohadas: number = 0
  ): Promise<void> {

    await addDoc(collection(db, 'combos'), {
      id,
      nombre,
      imagen,
      baseId,
      colchonId,
      espaldarId,

      baseColor: colores.baseColor,
      colchonColor: colores.colchonColor,
      espaldarColor: colores.espaldarColor,

      // Se conserva para los registros antiguos.
      precio,

      vendeContado,
      vendeCredito,

      precioContado: vendeContado ? precioContado : null,
      precioCredito: vendeCredito ? precioCredito : null,
      inicial: vendeCredito ? inicial : null,

      vendeQuincenal: vendeCredito ? vendeQuincenal : false,
      quincenal:
        vendeCredito && vendeQuincenal ? quincenal : null,
      cuotasQuincenales:
        vendeCredito && vendeQuincenal
          ? cuotasQuincenales
          : null,

      vendeMensual: vendeCredito ? vendeMensual : false,
      mensual:
        vendeCredito && vendeMensual ? mensual : null,
      cuotasMensuales:
        vendeCredito && vendeMensual
          ? cuotasMensuales
          : null,

      // ALMOHADAS OPCIONALES
      incluyeAlmohadas,
      cantidadAlmohadas: incluyeAlmohadas
        ? Math.max(0, Math.floor(Number(cantidadAlmohadas) || 0))
        : 0,

      descripcion
    });
  }

  // =========================
  // OBTENER COMBOS
  // =========================

  async obtenerCombo(): Promise<any[]> {
    const snapshot = await getDocs(collection(db, 'combos'));

    return snapshot.docs.map(documento => ({
      ...documento.data(),
      docId: documento.id,

      // Compatibilidad con combos antiguos.
      incluyeAlmohadas:
        documento.data()['incluyeAlmohadas'] ?? false,

      cantidadAlmohadas:
        documento.data()['cantidadAlmohadas'] ?? 0
    }));
  }

  // =========================
  // EDITAR COMBO
  // =========================

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
    vendeMensual: boolean = false,
    colores: ColoresCombo = {
      baseColor: '',
      colchonColor: '',
      espaldarColor: ''
    },
    incluyeAlmohadas: boolean = false,
    cantidadAlmohadas: number = 0
  ): Promise<void> {

    const comboRef = doc(db, 'combos', docId);

    await updateDoc(comboRef, {
      id,
      nombre,
      imagen,
      baseId,
      colchonId,
      espaldarId,

      baseColor: colores.baseColor,
      colchonColor: colores.colchonColor,
      espaldarColor: colores.espaldarColor,

      precio,
      vendeContado,
      vendeCredito,

      precioContado: vendeContado ? precioContado : null,
      precioCredito: vendeCredito ? precioCredito : null,
      inicial: vendeCredito ? inicial : null,

      vendeQuincenal: vendeCredito ? vendeQuincenal : false,
      quincenal:
        vendeCredito && vendeQuincenal ? quincenal : null,
      cuotasQuincenales:
        vendeCredito && vendeQuincenal
          ? cuotasQuincenales
          : null,

      vendeMensual: vendeCredito ? vendeMensual : false,
      mensual:
        vendeCredito && vendeMensual ? mensual : null,
      cuotasMensuales:
        vendeCredito && vendeMensual
          ? cuotasMensuales
          : null,

      // ALMOHADAS OPCIONALES
      incluyeAlmohadas,
      cantidadAlmohadas: incluyeAlmohadas
        ? Math.max(0, Math.floor(Number(cantidadAlmohadas) || 0))
        : 0,

      descripcion
    });
  }

  // =========================
  // ELIMINAR COMBO
  // =========================

  async eliminarCombo(docId: string): Promise<void> {
    await deleteDoc(doc(db, 'combos', docId));
  }

  productoParaVolver: string | null = null;
}
