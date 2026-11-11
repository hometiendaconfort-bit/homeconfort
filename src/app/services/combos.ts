
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

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
  providedIn: 'root'
})
export class Combos {

  private readonly STORAGE_KEY = 'homeconfort_combos_cache';

  private esNavegador: boolean;

  private cache: any[] | null = null;

  private solicitud: Promise<any[]> | null = null;

  productoParaVolver: string | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.esNavegador = isPlatformBrowser(this.platformId);
  }

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

      incluyeAlmohadas,
      cantidadAlmohadas: incluyeAlmohadas
        ? Math.max(0, Math.floor(Number(cantidadAlmohadas) || 0))
        : 0,

      descripcion
    });

    this.invalidarCache();
  }

  // =========================
  // OBTENER COMBOS
  // =========================

  async obtenerCombo(): Promise<any[]> {

    // Recuperar la caché del navegador si todavía no está en memoria.
    if (this.cache === null) {
      this.cargarCacheLocal();
    }

    // Si hay una consulta en curso, reutilizarla.
    if (this.solicitud !== null) {
      return this.solicitud;
    }

    // Si existe caché, devolverla inmediatamente.
    if (this.cache !== null) {

      // Actualizar Firebase en segundo plano.
      this.actualizarCacheEnSegundoPlano();

      return this.cache;
    }

    // Primera carga: consultar Firebase.
    return this.consultarFirebase();
  }

  // =========================
  // CONSULTAR FIREBASE
  // =========================

  private consultarFirebase(): Promise<any[]> {

    if (this.solicitud !== null) {
      return this.solicitud;
    }

    const solicitud = getDocs(
      collection(db, 'combos')
    )
      .then(snapshot => {

        const combos = snapshot.docs.map(documento => {

          const datos = documento.data();

          return {
            ...datos,
            docId: documento.id,

            incluyeAlmohadas:
              datos['incluyeAlmohadas'] ?? false,

            cantidadAlmohadas:
              datos['cantidadAlmohadas'] ?? 0
          };
        });

        this.cache = combos;

        this.guardarCacheLocal(combos);

        return combos;
      })
      .catch(error => {

        console.error(
          'Error al cargar los combos:',
          error
        );

        if (this.cache !== null) {
          return this.cache;
        }

        throw error;
      })
      .finally(() => {

        this.solicitud = null;

      });

    this.solicitud = solicitud;

    return solicitud;
  }

  // =========================
  // ACTUALIZAR CACHÉ EN SEGUNDO PLANO
  // =========================

  private actualizarCacheEnSegundoPlano(): void {

    if (this.solicitud !== null) {
      return;
    }

    this.consultarFirebase().catch(error => {

      console.warn(
        'No se pudo actualizar la caché de combos:',
        error
      );

    });
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

      incluyeAlmohadas,
      cantidadAlmohadas: incluyeAlmohadas
        ? Math.max(0, Math.floor(Number(cantidadAlmohadas) || 0))
        : 0,

      descripcion
    });

    this.invalidarCache();
  }

  // =========================
  // ELIMINAR COMBO
  // =========================

  async eliminarCombo(docId: string): Promise<void> {

    await deleteDoc(doc(db, 'combos', docId));

    this.invalidarCache();
  }

  // =========================
  // CARGAR CACHÉ LOCAL
  // =========================

  private cargarCacheLocal(): void {

    if (!this.esNavegador) {
      return;
    }

    try {

      const datos = localStorage.getItem(this.STORAGE_KEY);

      if (!datos) {
        return;
      }

      const combos: unknown = JSON.parse(datos);

      if (Array.isArray(combos)) {
        this.cache = combos;
      }

    } catch (error) {

      console.warn(
        'Error al recuperar la caché de combos:',
        error
      );

      this.cache = null;
    }
  }

  // =========================
  // GUARDAR CACHÉ LOCAL
  // =========================

  private guardarCacheLocal(combos: any[]): void {

    if (!this.esNavegador) {
      return;
    }

    try {

      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(combos)
      );

    } catch (error) {

      console.warn(
        'Error al guardar la caché de combos:',
        error
      );
    }
  }

  // =========================
  // INVALIDAR CACHÉ
  // =========================

  invalidarCache(): void {

    this.cache = null;
    this.solicitud = null;

    if (this.esNavegador) {

      try {

        localStorage.removeItem(this.STORAGE_KEY);

      } catch (error) {

        console.warn(
          'Error al limpiar la caché de combos:',
          error
        );
      }
    }
  }
}
