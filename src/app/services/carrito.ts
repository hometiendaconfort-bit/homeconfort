
import { Injectable, afterNextRender, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ModalidadCarrito = 'contado' | 'credito';
export type FrecuenciaCarrito = 'quincenal' | 'mensual';

export interface ProductoCarrito {
  clave: string;
  id: number | string;
  nombre: string;
  imagen: string;
  color: string;
  modalidad: ModalidadCarrito;
  precio: number;
  inicial: number;
  frecuencia: FrecuenciaCarrito;
  valorCuota: number;
  numeroCuotas: number;
  cantidad: number;
}

@Injectable({
  providedIn: 'root'
})
export class Carrito {

  private readonly STORAGE_KEY = 'homeconfort_carrito';
  private readonly platformId = inject(PLATFORM_ID);

  private productosSubject = new BehaviorSubject<ProductoCarrito[]>([]);

  productos$ = this.productosSubject.asObservable();

  constructor() {
    // Cargar el carrito después del renderizado inicial en el navegador.
    // Así se evita acceder a localStorage durante SSR y se reduce
    // el riesgo de diferencias durante la hidratación.
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.productosSubject.next(this.cargarCarrito());
      }
    });
  }

  obtenerProductos(): ProductoCarrito[] {
    return this.productosSubject.value;
  }

  private convertirNumero(valor: unknown): number {
    const numero = Number(valor);
    return Number.isFinite(numero) && numero >= 0 ? numero : 0;
  }

  private normalizarProducto(valor: any): ProductoCarrito | null {
    if (!valor || typeof valor !== 'object') {
      return null;
    }

    const modalidad: ModalidadCarrito =
      valor.modalidad === 'credito' ? 'credito' : 'contado';

    const frecuencia: FrecuenciaCarrito =
      valor.frecuencia === 'mensual' ? 'mensual' : 'quincenal';

    const id = valor.id;

    if (
      (typeof id !== 'string' && typeof id !== 'number') ||
      String(id).trim() === ''
    ) {
      return null;
    }

    const clave = String(valor.clave || '').trim();
    const nombre = String(valor.nombre || '').trim();

    if (!clave || !nombre) {
      return null;
    }

    return {
      clave,
      id,
      nombre,
      imagen: typeof valor.imagen === 'string' ? valor.imagen : '',
      color: typeof valor.color === 'string' ? valor.color : '',
      modalidad,
      precio: this.convertirNumero(valor.precio),
      inicial: this.convertirNumero(valor.inicial),
      frecuencia,
      valorCuota: this.convertirNumero(valor.valorCuota),
      numeroCuotas: Math.floor(this.convertirNumero(valor.numeroCuotas)),
      cantidad: Math.max(
        1,
        Math.floor(this.convertirNumero(valor.cantidad) || 1)
      )
    };
  }

  private cargarCarrito(): ProductoCarrito[] {
    try {
      if (!isPlatformBrowser(this.platformId)) {
        return [];
      }

      const guardado = localStorage.getItem(this.STORAGE_KEY);

      if (!guardado) {
        return [];
      }

      const datos: unknown = JSON.parse(guardado);

      if (!Array.isArray(datos)) {
        return [];
      }

      return datos
        .map(producto => this.normalizarProducto(producto))
        .filter((producto): producto is ProductoCarrito => producto !== null);

    } catch (error) {
      console.error('Error cargando el carrito:', error);
      return [];
    }
  }

  private guardarCarrito(productos: ProductoCarrito[]): void {
    this.productosSubject.next(productos);

    try {
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(
          this.STORAGE_KEY,
          JSON.stringify(productos)
        );
      }
    } catch (error) {
      console.error('Error guardando el carrito:', error);
    }
  }

  agregarProducto(producto: ProductoCarrito): void {
    const productoNormalizado = this.normalizarProducto(producto);

    if (!productoNormalizado) {
      console.error('No se pudo agregar el producto: datos inválidos.');
      return;
    }

    const productos = [...this.productosSubject.value];

    const existente = productos.find(
      p => p.clave === productoNormalizado.clave
    );

    if (existente) {
      existente.cantidad += productoNormalizado.cantidad;
    } else {
      productos.push(productoNormalizado);
    }

    this.guardarCarrito(productos);
  }

  cambiarCantidad(clave: string, cantidad: number): void {
    const nuevaCantidad = Math.floor(Number(cantidad));

    if (!Number.isFinite(nuevaCantidad) || nuevaCantidad < 1) {
      return;
    }

    const productos = this.productosSubject.value.map(producto =>
      producto.clave === clave
        ? { ...producto, cantidad: nuevaCantidad }
        : producto
    );

    this.guardarCarrito(productos);
  }

  eliminarProducto(clave: string): void {
    const productos = this.productosSubject.value.filter(
      producto => producto.clave !== clave
    );

    this.guardarCarrito(productos);
  }

  vaciarCarrito(): void {
    this.guardarCarrito([]);
  }

  obtenerCantidadTotal(): number {
    return this.productosSubject.value.reduce(
      (total, producto) => total + producto.cantidad,
      0
    );
  }

  obtenerTotal(): number {
    return this.productosSubject.value.reduce(
      (total, producto) => total + producto.precio * producto.cantidad,
      0
    );
  }
}
