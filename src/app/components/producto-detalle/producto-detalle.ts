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

        console.log('Datos originales de Firebase:', encontrado);

        // CONVERTIR VALORES A NÚMEROS
        const convertirNumero = (valor: any): number => {
          if (typeof valor === 'number') {
            return Number.isFinite(valor) ? valor : 0;
          }

          if (valor === null || valor === undefined || valor === '') {
            return 0;
          }

          if (typeof valor === 'string') {
            const texto = valor.trim();

            // Admite valores escritos como "80.000" o "$80.000".
            const limpio = texto.replace(/[^\d,.-]/g, '');

            if (!limpio) {
              return 0;
            }

            const normalizado = limpio.includes(',')
              ? limpio.replace(/\./g, '').replace(',', '.')
              : limpio.replace(/\./g, '');

            const numero = Number(normalizado);

            return Number.isFinite(numero) ? numero : 0;
          }

          const numero = Number(valor);

          return Number.isFinite(numero) ? numero : 0;
        };

        // BUSCAR EL PRIMER CAMPO QUE TENGA UN VALOR DEFINIDO
        const obtenerCampo = (
          objeto: any,
          campos: string[]
        ): any => {
          for (const campo of campos) {
            if (
              objeto[campo] !== undefined &&
              objeto[campo] !== null &&
              objeto[campo] !== ''
            ) {
              return objeto[campo];
            }
          }

          return 0;
        };

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

        const precioContado = convertirNumero(
          encontrado.precioContado ??
          (
            encontrado.tipo !== 'credito'
              ? encontrado.precio ?? 0
              : 0
          )
        );

        const precioCredito = convertirNumero(
          encontrado.precioCredito ??
          (
            encontrado.tipo !== 'contado'
              ? encontrado.precio ?? 0
              : 0
          )
        );

        // GALERÍA DE IMÁGENES
        const imagenes = Array.isArray(encontrado.imagenes)
          ? encontrado.imagenes
          : [];

        // VALORES DE LAS CUOTAS
        // Se comprueban también nombres alternativos por compatibilidad.
        const quincenal = convertirNumero(
          obtenerCampo(encontrado, [
            'quincenal',
            'valorQuincenal',
            'cuotaQuincenal',
            'pagoQuincenal'
          ])
        );

        const mensual = convertirNumero(
          obtenerCampo(encontrado, [
            'mensual',
            'valorMensual',
            'cuotaMensual',
            'pagoMensual'
          ])
        );

        // NÚMERO DE CUOTAS QUINCENALES
        const numeroCuotasQuincenal = convertirNumero(
          obtenerCampo(encontrado, [
            'numeroCuotasQuincenal',
            'cuotasQuincenales'
          ]) ||
          (
            encontrado.frecuenciaPago === 'quincenal'
              ? encontrado.numeroCuotas ?? 0
              : 0
          )
        );

        // NÚMERO DE CUOTAS MENSUALES
        const numeroCuotasMensual = convertirNumero(
          obtenerCampo(encontrado, [
            'numeroCuotasMensual',
            'cuotasMensuales'
          ]) ||
          (
            encontrado.frecuenciaPago === 'mensual'
              ? encontrado.numeroCuotas ?? 0
              : 0
          )
        );

        // CONSTRUIR EL PRODUCTO PARA LA VISTA
        this.producto = {
          ...encontrado,
          vendeContado: Boolean(vendeContado),
          vendeCredito: Boolean(vendeCredito),
          precioContado,
          precioCredito,
          inicial: convertirNumero(encontrado.inicial),
          quincenal,
          mensual,
          numeroCuotasQuincenal,
          numeroCuotasMensual,
          descuento: convertirNumero(encontrado.descuento),
          imagenes,
          imagenActiva: imagenes[0] || encontrado.imagen || ''
        };

        // ELEGIR LA MODALIDAD INICIAL
        if (this.producto.vendeCredito && !this.producto.vendeContado) {
          this.modalidadSeleccionada = 'credito';
        } else {
          this.modalidadSeleccionada = 'contado';
        }

        // ELEGIR UNA FRECUENCIA DISPONIBLE
        if (quincenal > 0) {
          this.frecuenciaSeleccionada = 'quincenal';
        } else if (mensual > 0) {
          this.frecuenciaSeleccionada = 'mensual';
        } else {
          this.frecuenciaSeleccionada = 'quincenal';
        }

        console.log('Producto preparado para los detalles:', this.producto);
        console.log('Cuota quincenal:', this.producto.quincenal);
        console.log('Cuota mensual:', this.producto.mensual);
        console.log('Vende a crédito:', this.producto.vendeCredito);
      },

      error: err => {
        console.error('Error cargando el detalle del producto:', err);
      }
    });
  }

  // COMPROBAR SI EXISTE ALGUNA FRECUENCIA DE PAGO
  tieneFrecuenciasDisponibles(): boolean {
    return Number(this.producto?.quincenal ?? 0) > 0 ||
           Number(this.producto?.mensual ?? 0) > 0;
  }

  // CAMBIAR ENTRE CONTADO Y CRÉDITO
  seleccionarModalidad(modalidad: 'contado' | 'credito'): void {
    if (!this.producto) {
      return;
    }

    if (modalidad === 'contado' && this.producto.vendeContado) {
      this.modalidadSeleccionada = 'contado';
      return;
    }

    if (modalidad === 'credito' && this.producto.vendeCredito) {
      this.modalidadSeleccionada = 'credito';

      // Si la frecuencia actual no existe, seleccionar la disponible.
      if (
        this.frecuenciaSeleccionada === 'quincenal' &&
        Number(this.producto.quincenal) <= 0
      ) {
        this.frecuenciaSeleccionada =
          Number(this.producto.mensual) > 0
            ? 'mensual'
            : 'quincenal';
      } else if (
        this.frecuenciaSeleccionada === 'mensual' &&
        Number(this.producto.mensual) <= 0
      ) {
        this.frecuenciaSeleccionada =
          Number(this.producto.quincenal) > 0
            ? 'quincenal'
            : 'mensual';
      }
    }
  }

  // CAMBIAR LA FRECUENCIA DEL CRÉDITO
  seleccionarFrecuencia(
    frecuencia: 'quincenal' | 'mensual'
  ): void {
    if (
      !this.producto ||
      this.modalidadSeleccionada !== 'credito'
    ) {
      return;
    }

    if (
      frecuencia === 'quincenal' &&
      Number(this.producto.quincenal) > 0
    ) {
      this.frecuenciaSeleccionada = 'quincenal';
    }

    if (
      frecuencia === 'mensual' &&
      Number(this.producto.mensual) > 0
    ) {
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

    // El descuento solo se aplica al contado.
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

  // NOMBRE DE LA FRECUENCIA SELECCIONADA
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

  // GENERAR EL MENSAJE Y EL ENLACE DE WHATSAPP
  obtenerLinkWhatsApp(p: any): string {
    let modalidad = this.modalidadSeleccionada;

    // Asegurar que la modalidad esté disponible.
    if (modalidad === 'contado' && !p.vendeContado) {
      modalidad = 'credito';
    }

    if (modalidad === 'credito' && !p.vendeCredito) {
      modalidad = 'contado';
    }

    const precio = this.precioFinal(p, modalidad);

    let mensaje =
      `Hola, estoy interesado en el producto ${p.nombre}. `;

    if (modalidad === 'contado') {
      mensaje +=
        `Deseo comprarlo de contado. ` +
        `Precio de contado: ${this.formatearPrecio(precio)}.`;
    } else {
      mensaje +=
        `Deseo comprarlo a crédito. ` +
        `Precio a crédito: ${this.formatearPrecio(precio)}.`;

      if (Number(p.inicial) > 0) {
        mensaje +=
          ` Cuota inicial: ${this.formatearPrecio(Number(p.inicial))}.`;
      }

      const valorCuota = this.obtenerValorCuota(p);
      const numeroCuotas = this.obtenerNumeroCuotas(p);
      const frecuencia = this.obtenerNombreFrecuencia();

      if (valorCuota > 0) {
        mensaje +=
          ` Frecuencia de pago elegida: ${frecuencia}.` +
          ` Valor de cada cuota: ${this.formatearPrecio(valorCuota)}.`;
      }

      if (numeroCuotas > 0) {
        mensaje +=
          ` Número de cuotas ${frecuencia}: ${numeroCuotas}.`;
      }

      if (valorCuota <= 0) {
        mensaje +=
          ' Quisiera que me informaran sobre las opciones de pago disponibles.';
      }
    }

    return `https://wa.me/573137110232?text=${encodeURIComponent(mensaje)}`;
  }
}