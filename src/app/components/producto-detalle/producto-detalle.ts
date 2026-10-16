
import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductosService } from '../../services/producto.service';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './producto-detalle.html',
  styleUrl: './producto-detalle.css',
})
export class ProductoDetalleComponent implements OnInit {

  producto: any = null;

  // GUARDO LA MODALIDAD SELECCIONADA
  modalidadSeleccionada: 'contado' | 'credito' = 'contado';

  constructor(
    private route: ActivatedRoute,
    private productosService: ProductosService,
    private location: Location
  ) {}

  ngOnInit(): void {

    const idRuta = this.route.snapshot.paramMap.get('id');

    if (!idRuta) {
      console.error('No se recibió el ID del producto en la URL');
      return;
    }

    this.productosService.getProductos().subscribe({
      next: (res: any[]) => {

        // BUSCO EL PRODUCTO POR ID O POR ID DEL DOCUMENTO
        const encontrado = res.find((p: any) =>
          String(p.id ?? '') === String(idRuta) ||
          String(p.docId ?? '') === String(idRuta)
        );

        if (!encontrado) {
          console.error('No se encontró el producto:', idRuta);
          console.log('Productos recibidos:', res);
          return;
        }

        // ADAPTO LOS PRODUCTOS NUEVOS Y ANTIGUOS
        const vendeContado = encontrado.vendeContado ??
          (
            encontrado.tipo === 'contado' ||
            encontrado.tipo === 'ambos' ||
            (!encontrado.tipo && encontrado.precio != null)
          );

        const vendeCredito = encontrado.vendeCredito ??
          (
            encontrado.tipo === 'credito' ||
            encontrado.tipo === 'ambos'
          );

        const precioContado = encontrado.precioContado ??
          (
            encontrado.tipo !== 'credito'
              ? encontrado.precio ?? null
              : null
          );

        const precioCredito = encontrado.precioCredito ??
          (
            encontrado.tipo !== 'contado'
              ? encontrado.precio ?? null
              : null
          );

        const imagenes = Array.isArray(encontrado.imagenes)
          ? encontrado.imagenes
          : [];

        // CONSERVO LOS DATOS DEL PRODUCTO Y SUS PRECIOS
        this.producto = {
          ...encontrado,
          vendeContado,
          vendeCredito,
          precioContado,
          precioCredito,
          inicial: encontrado.inicial ?? null,
          quincenal: encontrado.quincenal ?? null,
          descuento: Number(encontrado.descuento ?? 0),
          imagenes,
          imagenActiva: imagenes[0] || encontrado.imagen || ''
        };

        // SELECCIONO UNA MODALIDAD DISPONIBLE
        if (this.producto.vendeCredito && !this.producto.vendeContado) {
          this.modalidadSeleccionada = 'credito';
        } else {
          this.modalidadSeleccionada = 'contado';
        }

        console.log('Producto cargado:', this.producto);
      },

      error: err => {
        console.error('Error cargando el detalle del producto:', err);
      }
    });
  }

  // CAMBIAR LA MODALIDAD DE COMPRA
  seleccionarModalidad(modalidad: 'contado' | 'credito'): void {

    if (
      modalidad === 'contado' &&
      this.producto?.vendeContado
    ) {
      this.modalidadSeleccionada = 'contado';
    }

    if (
      modalidad === 'credito' &&
      this.producto?.vendeCredito
    ) {
      this.modalidadSeleccionada = 'credito';
    }
  }

  // CAMBIAR LA IMAGEN PRINCIPAL
  cambiarImagen(p: any, img: string): void {
    p.imagenActiva = img;
  }

  // VOLVER A LA PÁGINA ANTERIOR
  volver(): void {
    this.location.back();
  }

  // OBTENER EL PRECIO ORIGINAL ANTES DEL DESCUENTO
  precioOriginal(p: any): number {
    return Number(p.precioContado ?? p.precio ?? 0);
  }

  // CALCULAR EL PRECIO SEGÚN LA MODALIDAD
  precioFinal(
    p: any,
    modalidad: 'contado' | 'credito' = 'contado'
  ): number {

    const precioBase = Number(
      modalidad === 'credito'
        ? (p.precioCredito ?? p.precio ?? 0)
        : (p.precioContado ?? p.precio ?? 0)
    );

    // EL CRÉDITO NO LLEVA DESCUENTO
    if (modalidad === 'credito') {
      return precioBase;
    }

    // CALCULAR EL DESCUENTO DE CONTADO
    const descuento = Number(p.descuento ?? 0);

    if (descuento > 0) {
      return precioBase - (precioBase * descuento / 100);
    }

    return precioBase;
  }

  // FORMATEAR VALORES PARA WHATSAPP
  private formatearPrecio(valor: number): string {
    return Number(valor || 0).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    });
  }

  // CREAR EL ENLACE DE WHATSAPP
  obtenerLinkWhatsApp(p: any): string {

    let modalidad = this.modalidadSeleccionada;

    // EVITAR UNA MODALIDAD NO DISPONIBLE
    if (modalidad === 'contado' && !p.vendeContado) {
      modalidad = 'credito';
    }

    if (modalidad === 'credito' && !p.vendeCredito) {
      modalidad = 'contado';
    }

    const precio = this.precioFinal(p, modalidad);

    const nombreModalidad = modalidad === 'contado'
      ? 'de contado'
      : 'a crédito';

    let mensaje =
      `Hola, estoy interesado en el producto ${p.nombre}. ` +
      `Quiero comprarlo ${nombreModalidad}. ` +
      `Precio: ${this.formatearPrecio(precio)}.`;

    // AGREGAR LOS DATOS DE FINANCIACIÓN
    if (modalidad === 'credito') {

      if (p.inicial != null && p.inicial !== '') {
        mensaje +=
          ` Cuota inicial: ${this.formatearPrecio(Number(p.inicial))}.`;
      }

      if (p.quincenal != null && p.quincenal !== '') {
        mensaje +=
          ` Pago quincenal: ${this.formatearPrecio(Number(p.quincenal))}.`;
      }
    }

    return `https://wa.me/573137110232?text=${encodeURIComponent(mensaje)}`;
  }
}