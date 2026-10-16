
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { Combos } from '../services/combos';
import { Productos } from '../services/productos';

@Component({
  selector: 'app-combo-detalle',
  imports: [CommonModule, RouterModule],
  templateUrl: './combos-detalle.html',
  styleUrl: './combos-detalle.css',
})
export class ComboDetalleComponent implements OnInit {

  // Aquí guardamos el combo seleccionado
  combo: any;

  // Aquí guardamos todos los productos
  productosLista: any[] = [];

  // Modalidad seleccionada
  modalidad: 'contado' | 'credito' = 'credito';

  constructor(
    private route: ActivatedRoute,
    private combos: Combos,
    private productos: Productos,
    private cdr: ChangeDetectorRef,
    private location: Location
  ) {}

  async ngOnInit() {
    try {

      // Obtiene el docId que viene en la URL
      const docId = this.route.snapshot.paramMap.get('id');

      // Obtiene todos los combos
      const combos = await this.combos.obtenerCombo();

      // Obtiene todos los productos
      const productos = await this.productos.obtenerProductos();

      // Guarda los productos
      this.productosLista = productos;

      // Busca el combo seleccionado
      this.combo = combos.find(
        combo => combo.docId === docId
      );

      // Si encontró el combo
      if (this.combo) {

        // Imagen inicial del combo
        this.combo.imagenActiva = this.combo.imagen;

        // Selecciona una modalidad disponible
        if (this.combo.vendeCredito) {
          this.modalidad = 'credito';
        } else if (this.combo.vendeContado) {
          this.modalidad = 'contado';
        }

      }

      // Actualiza la vista
      this.cdr.detectChanges();

    } catch (error) {
      console.error('Error cargando el combo:', error);
    }
  }

  // Busca un producto por su docId
  obtenerProducto(docId: string) {
    return this.productosLista.find(
      producto => producto.docId === docId
    );
  }

  // Cambia la imagen principal
  cambiarImagen(combo: any, imagen: string) {
    combo.imagenActiva = imagen;
  }

  // Cambia entre contado y crédito
  seleccionarModalidad(modalidad: 'contado' | 'credito') {

    if (
      (modalidad === 'contado' && this.combo?.vendeContado) ||
      (modalidad === 'credito' && this.combo?.vendeCredito)
    ) {
      this.modalidad = modalidad;
    }
  }

  // Obtiene el precio final según la modalidad
  obtenerPrecio(combo: any): number {

    if (this.modalidad === 'contado') {
      const precio = Number(combo.precioContado) || 0;
      const descuento = Number(combo.descuento) || 0;

      return descuento > 0
        ? precio - (precio * descuento / 100)
        : precio;
    }

    return Number(combo.precioCredito) || 0;
  }

  // Genera el enlace de WhatsApp
  obtenerLinkWhatsApp(combo: any): string {

    const precio = this.obtenerPrecio(combo);

    const nombreModalidad =
      this.modalidad === 'contado'
        ? 'de contado'
        : 'a crédito';

    let mensaje =
      `Hola, estoy interesado en el combo ${combo.nombre}. ` +
      `Modalidad: ${nombreModalidad}. ` +
      `Precio: ${precio.toLocaleString('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      })}.`;

    // Agrega la información de crédito al mensaje
    if (this.modalidad === 'credito') {

      if (combo.inicial != null) {
        mensaje +=
          ` Cuota inicial: ${Number(combo.inicial).toLocaleString('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
          })}.`;
      }

      if (combo.quincenal != null) {
        mensaje +=
          ` Pago quincenal: ${Number(combo.quincenal).toLocaleString('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
          })}.`;
      }
    }

    return `https://wa.me/573137110232?text=${encodeURIComponent(mensaje)}`;
  }

  // Regresa a la página anterior
  volver() {
    this.location.back();
  }
}
