
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { Combos } from '../services/combos';
import { Productos } from '../services/productos';

@Component({
  selector: 'app-combo-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './combos-detalle.html',
  styleUrl: './combos-detalle.css',
})
export class ComboDetalleComponent implements OnInit {

  // COMBO SELECCIONADO
  combo: any;

  // TODOS LOS PRODUCTOS
  productosLista: any[] = [];

  // MODALIDAD SELECCIONADA
  modalidad: 'contado' | 'credito' = 'credito';

  // FRECUENCIA DE PAGO SELECCIONADA
  frecuencia: 'quincenal' | 'mensual' = 'quincenal';

  constructor(
    private route: ActivatedRoute,
    private combos: Combos,
    private productos: Productos,
    private cdr: ChangeDetectorRef,
    private location: Location
  ) {}

  async ngOnInit() {
    try {

      // OBTIENE EL ID DE LA URL
      const docId = this.route.snapshot.paramMap.get('id');

      if (!docId) {
        return;
      }

      // OBTIENE LOS COMBOS Y PRODUCTOS
      const combos = await this.combos.obtenerCombo();
      const productos = await this.productos.obtenerProductos();

      this.productosLista = productos;

      // BUSCA EL COMBO SELECCIONADO
      const comboEncontrado = combos.find(
        combo => combo.docId === docId
      );

      if (!comboEncontrado) {
        this.cdr.detectChanges();
        return;
      }

      // COMPATIBILIDAD CON COMBOS ANTIGUOS
      const vendeContado =
        comboEncontrado.vendeContado ??
        (
          comboEncontrado.tipo === 'contado' ||
          comboEncontrado.tipo === 'ambos' ||
          (!comboEncontrado.tipo && comboEncontrado.precio != null)
        );

      const vendeCredito =
        comboEncontrado.vendeCredito ??
        (
          comboEncontrado.tipo === 'credito' ||
          comboEncontrado.tipo === 'ambos'
        );

      const precioContado =
        comboEncontrado.precioContado ??
        (
          comboEncontrado.tipo !== 'credito'
            ? comboEncontrado.precio
            : null
        );

      const precioCredito =
        comboEncontrado.precioCredito ??
        (
          comboEncontrado.tipo !== 'contado'
            ? comboEncontrado.precio
            : null
        );

      const vendeQuincenal =
        comboEncontrado.vendeQuincenal ??
        (Number(comboEncontrado.quincenal) > 0);

      const vendeMensual =
        comboEncontrado.vendeMensual ??
        (Number(comboEncontrado.mensual) > 0);

      // ALMOHADAS: COMPATIBILIDAD CON COMBOS ANTIGUOS
      const incluyeAlmohadas =
        comboEncontrado.incluyeAlmohadas ?? false;

      const cantidadAlmohadas =
        incluyeAlmohadas
          ? Math.max(
              0,
              Math.floor(Number(comboEncontrado.cantidadAlmohadas) || 0)
            )
          : 0;

      // PREPARA EL COMBO PARA LA VISTA
      this.combo = {
        ...comboEncontrado,
        vendeContado,
        vendeCredito,
        precioContado,
        precioCredito,
        vendeQuincenal,
        vendeMensual,
        incluyeAlmohadas,
        cantidadAlmohadas,
        imagenActiva: comboEncontrado.imagen
      };

      // SELECCIONA UNA MODALIDAD DISPONIBLE
      if (this.combo.vendeCredito) {
        this.modalidad = 'credito';
      } else if (this.combo.vendeContado) {
        this.modalidad = 'contado';
      }

      // SELECCIONA UNA FRECUENCIA DISPONIBLE
      if (this.combo.vendeQuincenal) {
        this.frecuencia = 'quincenal';
      } else if (this.combo.vendeMensual) {
        this.frecuencia = 'mensual';
      }

      this.cdr.detectChanges();

    } catch (error) {
      console.error('Error cargando el combo:', error);
    }
  }

  // BUSCA UN PRODUCTO POR SU DOCID
  obtenerProducto(docId: string) {
    return this.productosLista.find(
      producto => producto.docId === docId
    );
  }

  // CAMBIA LA IMAGEN PRINCIPAL
  cambiarImagen(combo: any, imagen: string) {
    combo.imagenActiva = imagen;
  }

  // CAMBIA ENTRE CONTADO Y CRÉDITO
  seleccionarModalidad(modalidad: 'contado' | 'credito') {

    if (
      (modalidad === 'contado' && this.combo?.vendeContado) ||
      (modalidad === 'credito' && this.combo?.vendeCredito)
    ) {
      this.modalidad = modalidad;
    }
  }

  // CAMBIA LA FRECUENCIA DE PAGO
  seleccionarFrecuencia(frecuencia: 'quincenal' | 'mensual') {

    if (
      frecuencia === 'quincenal' &&
      this.combo?.vendeQuincenal
    ) {
      this.frecuencia = 'quincenal';
    }

    if (
      frecuencia === 'mensual' &&
      this.combo?.vendeMensual
    ) {
      this.frecuencia = 'mensual';
    }
  }

  // OBTIENE LA FRECUENCIA DISPONIBLE
  obtenerFrecuencia(combo: any): 'quincenal' | 'mensual' {
    if (
      this.frecuencia === 'quincenal' &&
      combo.vendeQuincenal
    ) {
      return 'quincenal';
    }

    if (combo.vendeMensual) {
      return 'mensual';
    }

    return 'quincenal';
  }

  // OBTIENE EL PRECIO FINAL SEGÚN LA MODALIDAD
  obtenerPrecio(combo: any): number {

    if (this.modalidad === 'contado') {
      const precio = Number(
        combo.precioContado ?? combo.precio
      ) || 0;

      const descuento = Number(combo.descuento) || 0;

      return descuento > 0
        ? precio - (precio * descuento / 100)
        : precio;
    }

    return Number(
      combo.precioCredito ?? combo.precio
    ) || 0;
  }

  // FORMATEA UN VALOR COMO PESOS COLOMBIANOS
  private formatoPesos(valor: number): string {
    return Number(valor).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    });
  }

  // GENERA EL ENLACE DE WHATSAPP
  obtenerLinkWhatsApp(combo: any): string {

    const precio = this.obtenerPrecio(combo);

    const nombreModalidad =
      this.modalidad === 'contado'
        ? 'de contado'
        : 'a crédito';

    let mensaje =
      `Hola, estoy interesado en el combo ${combo.nombre}. ` +
      `Modalidad: ${nombreModalidad}. ` +
      `Precio: ${this.formatoPesos(precio)}.`;

    // INFORMACIÓN DE ALMOHADAS
    if (combo.incluyeAlmohadas && combo.cantidadAlmohadas > 0) {
      const cantidad = combo.cantidadAlmohadas;
      const textoAlmohadas = cantidad === 1
        ? 'almohada'
        : 'almohadas';

      mensaje += ` Incluye ${cantidad} ${textoAlmohadas}.`;
    }

    // INFORMACIÓN ADICIONAL DE CRÉDITO
    if (this.modalidad === 'credito') {

      if (combo.inicial != null) {
        mensaje +=
          ` Cuota inicial: ${this.formatoPesos(Number(combo.inicial))}.`;
      }

      const frecuenciaSeleccionada = this.obtenerFrecuencia(combo);

      // PAGO QUINCENAL
      if (
        frecuenciaSeleccionada === 'quincenal' &&
        combo.vendeQuincenal
      ) {

        if (combo.quincenal != null) {
          mensaje +=
            ` Cuota quincenal: ${this.formatoPesos(Number(combo.quincenal))}.`;
        }

        if (combo.cuotasQuincenales != null) {
          mensaje +=
            ` Número de cuotas quincenales: ${combo.cuotasQuincenales}.`;
        }
      }

      // PAGO MENSUAL
      if (
        frecuenciaSeleccionada === 'mensual' &&
        combo.vendeMensual
      ) {

        if (combo.mensual != null) {
          mensaje +=
            ` Cuota mensual: ${this.formatoPesos(Number(combo.mensual))}.`;
        }

        if (combo.cuotasMensuales != null) {
          mensaje +=
            ` Número de cuotas mensuales: ${combo.cuotasMensuales}.`;
        }
      }
    }

    return `https://wa.me/573137110232?text=${encodeURIComponent(mensaje)}`;
  }

  // REGRESA A LA PÁGINA ANTERIOR
  volver() {
    this.location.back();
  }
}
