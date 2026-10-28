
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

  modalidadSeleccionada: 'contado' | 'credito' = 'contado';
  frecuenciaSeleccionada: 'quincenal' | 'mensual' = 'quincenal';

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
        const encontrado = res.find((p: any) =>
          String(p.id ?? '') === String(idRuta) ||
          String(p.docId ?? '') === String(idRuta)
        );

        if (!encontrado) {
          console.error('No se encontró el producto:', idRuta);
          return;
        }

        // COMPATIBILIDAD CON PRODUCTOS ANTIGUOS
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

        const quincenal = Number(encontrado.quincenal ?? 0);
        const mensual = Number(encontrado.mensual ?? 0);

        // COMPATIBILIDAD CON EL NÚMERO DE CUOTAS ANTIGUO
        const numeroCuotasQuincenal = Number(
          encontrado.numeroCuotasQuincenal ??
          (encontrado.frecuenciaPago === 'quincenal'
            ? encontrado.numeroCuotas ?? 0
            : 0)
        );

        const numeroCuotasMensual = Number(
          encontrado.numeroCuotasMensual ??
          (encontrado.frecuenciaPago === 'mensual'
            ? encontrado.numeroCuotas ?? 0
            : 0)
        );

        this.producto = {
          ...encontrado,
          vendeContado,
          vendeCredito,
          precioContado,
          precioCredito,
          inicial: Number(encontrado.inicial ?? 0),
          quincenal,
          mensual,
          numeroCuotasQuincenal,
          numeroCuotasMensual,
          descuento: Number(encontrado.descuento ?? 0),
          imagenes,
          imagenActiva: imagenes[0] || encontrado.imagen || ''
        };

        // SELECCIONAR MODALIDAD DISPONIBLE
        if (vendeCredito && !vendeContado) {
          this.modalidadSeleccionada = 'credito';
        } else {
          this.modalidadSeleccionada = 'contado';
        }

        // ELEGIR UNA FRECUENCIA DISPONIBLE
        if (mensual > 0 && quincenal <= 0) {
          this.frecuenciaSeleccionada = 'mensual';
        } else {
          this.frecuenciaSeleccionada = 'quincenal';
        }

        console.log('Producto cargado:', this.producto);
      },
      error: err => {
        console.error('Error cargando el detalle del producto:', err);
      }
    });
  }

  // CAMBIAR ENTRE CONTADO Y CRÉDITO
  seleccionarModalidad(modalidad: 'contado' | 'credito'): void {
    if (modalidad === 'contado' && this.producto?.vendeContado) {
      this.modalidadSeleccionada = 'contado';
    }

    if (modalidad === 'credito' && this.producto?.vendeCredito) {
      this.modalidadSeleccionada = 'credito';

      if (this.obtenerValorCuota(this.producto) <= 0) {
        this.frecuenciaSeleccionada =
          this.producto.mensual > 0 ? 'mensual' : 'quincenal';
      }
    }
  }

  // CAMBIAR FRECUENCIA DEL CRÉDITO
  seleccionarFrecuencia(frecuencia: 'quincenal' | 'mensual'): void {
    if (!this.producto) {
      return;
    }

    if (frecuencia === 'quincenal' && this.producto.quincenal > 0) {
      this.frecuenciaSeleccionada = 'quincenal';
    }

    if (frecuencia === 'mensual' && this.producto.mensual > 0) {
      this.frecuenciaSeleccionada = 'mensual';
    }
  }

  // CAMBIAR IMAGEN PRINCIPAL
  cambiarImagen(p: any, img: string): void {
    p.imagenActiva = img;
  }

  // VOLVER A LA PÁGINA ANTERIOR
  volver(): void {
    this.location.back();
  }

  // PRECIO ORIGINAL ANTES DEL DESCUENTO
  precioOriginal(p: any): number {
    return Number(p.precioContado ?? p.precio ?? 0);
  }

  // CALCULAR PRECIO SEGÚN MODALIDAD
  precioFinal(
    p: any,
    modalidad: 'contado' | 'credito' = 'contado'
  ): number {
    const precioBase = Number(
      modalidad === 'credito'
        ? (p.precioCredito ?? p.precio ?? 0)
        : (p.precioContado ?? p.precio ?? 0)
    );

    if (modalidad === 'credito') {
      return precioBase;
    }

    const descuento = Number(p.descuento ?? 0);

    return descuento > 0
      ? precioBase - (precioBase * descuento / 100)
      : precioBase;
  }

  // VALOR DE LA CUOTA SELECCIONADA
  obtenerValorCuota(p: any): number {
    return this.frecuenciaSeleccionada === 'mensual'
      ? Number(p.mensual ?? 0)
      : Number(p.quincenal ?? 0);
  }

  // NÚMERO DE CUOTAS DE LA FRECUENCIA SELECCIONADA
  obtenerNumeroCuotas(p: any): number {
    return this.frecuenciaSeleccionada === 'mensual'
      ? Number(p.numeroCuotasMensual ?? 0)
      : Number(p.numeroCuotasQuincenal ?? 0);
  }

  // NOMBRE DE LA FRECUENCIA
  obtenerNombreFrecuencia(): string {
    return this.frecuenciaSeleccionada === 'mensual'
      ? 'mensual'
      : 'quincenal';
  }

  // FORMATEAR PRECIO EN PESOS COLOMBIANOS
  private formatearPrecio(valor: number): string {
    return Number(valor || 0).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    });
  }

  // GENERAR MENSAJE Y ENLACE DE WHATSAPP
  obtenerLinkWhatsApp(p: any): string {
    let modalidad = this.modalidadSeleccionada;

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

    if (modalidad === 'credito') {
      if (Number(p.inicial) > 0) {
        mensaje +=
          ` Cuota inicial: ${this.formatearPrecio(Number(p.inicial))}.`;
      }

      const valorCuota = this.obtenerValorCuota(p);
      const frecuencia = this.obtenerNombreFrecuencia();
      const numeroCuotas = this.obtenerNumeroCuotas(p);

      if (valorCuota > 0) {
        mensaje +=
          ` Pago ${frecuencia}: ${this.formatearPrecio(valorCuota)}.`;
      }

      if (numeroCuotas > 0) {
        mensaje +=
          ` Número de cuotas ${frecuencia}: ${numeroCuotas}.`;
      }
    }

    return `https://wa.me/573137110232?text=${encodeURIComponent(mensaje)}`;
  }
}
