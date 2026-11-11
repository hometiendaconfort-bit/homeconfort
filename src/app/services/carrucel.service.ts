
import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

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
  providedIn: 'root'
})
export class CarrucelService {

  private readonly STORAGE_KEY = 'homeconfort_carrucel_cache';

  private cache: any[] | null = null;

  private solicitud: Promise<any[]> | null = null;

  private esNavegador: boolean;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.esNavegador = isPlatformBrowser(this.platformId);
  }

  // =========================
  // OBTENER CARRUSEL
  // =========================

  async getCarrusel(): Promise<any[]> {

    // 1. Recuperar la caché local.
    if (this.cache === null) {
      this.cargarCacheLocal();
    }

    // 2. Si hay una consulta en curso, reutilizarla.
    if (this.solicitud !== null) {
      return this.solicitud;
    }

    // 3. Si tenemos imágenes guardadas, mostrarlas inmediatamente.
    if (this.cache !== null) {

      // Actualizar Firebase en segundo plano.
      this.actualizarCacheEnSegundoPlano();

      return this.cache;
    }

    // 4. Si no existe caché, consultar Firebase.
    return this.consultarFirebase();
  }

  // =========================
  // OBTENER CARRUSEL (COMPATIBILIDAD)
  // =========================

  async obtenerCarrucel(): Promise<any[]> {
    return this.getCarrusel();
  }

  // =========================
  // CONSULTAR FIREBASE
  // =========================

  private consultarFirebase(): Promise<any[]> {

    if (this.solicitud !== null) {
      return this.solicitud;
    }

    const solicitud = getDocs(
      collection(db, 'carrucel')
    )
      .then(snapshot => {

        const carrucel = snapshot.docs.map(documento => ({
          docId: documento.id,
          ...documento.data()
        }));

        this.cache = carrucel;

        this.guardarCacheLocal(carrucel);

        return carrucel;
      })
      .catch(error => {

        console.error(
          'Error al cargar el carrusel desde Firebase:',
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
        'No se pudo actualizar la caché del carrusel:',
        error
      );

    });
  }

  // =========================
  // AGREGAR CARRUSEL
  // =========================

  async agregarCarrucel(
    id: number,
    imagen: string
  ): Promise<void> {

    const carrucelRef = collection(
      db,
      'carrucel'
    );

    await addDoc(carrucelRef, {
      id,
      imagen
    });

    this.invalidarCache();
  }

  // =========================
  // ELIMINAR CARRUSEL
  // =========================

  async eliminarCarrucel(
    docId: string
  ): Promise<void> {

    const carrucelRef = doc(
      db,
      'carrucel',
      docId
    );

    await deleteDoc(carrucelRef);

    this.invalidarCache();
  }

  // =========================
  // EDITAR CARRUSEL
  // =========================

  async editarCarrucel(
    docId: string,
    id: number,
    imagen: string
  ): Promise<void> {

    const carrucelRef = doc(
      db,
      'carrucel',
      docId
    );

    await updateDoc(carrucelRef, {
      id,
      imagen
    });

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

      const datos = localStorage.getItem(
        this.STORAGE_KEY
      );

      if (!datos) {
        return;
      }

      const carrucel: unknown = JSON.parse(datos);

      if (Array.isArray(carrucel)) {
        this.cache = carrucel;
      }

    } catch (error) {

      console.warn(
        'Error al recuperar la caché del carrusel:',
        error
      );

      this.cache = null;
    }
  }

  // =========================
  // GUARDAR CACHÉ LOCAL
  // =========================

  private guardarCacheLocal(carrucel: any[]): void {

    if (!this.esNavegador) {
      return;
    }

    try {

      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(carrucel)
      );

    } catch (error) {

      console.warn(
        'Error al guardar la caché del carrusel:',
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

        localStorage.removeItem(
          this.STORAGE_KEY
        );

      } catch (error) {

        console.warn(
          'Error al limpiar la caché del carrusel:',
          error
        );
      }
    }
  }

}
