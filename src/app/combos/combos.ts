
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Combos } from '../services/combos';
import { Productos } from '../services/productos';
import { Router } from '@angular/router';

@Component({
  selector: 'app-combos',
  imports: [CommonModule],
  templateUrl: './combos.html',
  styleUrl: './combos.css',
})
export class CombosComponent implements OnInit {

  comboLista: any[] = [];
  productosLista: any[] = [];
  descripcion: string = 'Combos a Credito y Contado';

  // GUARDO LA MODALIDAD SELECCIONADA PARA CADA COMBO
  modalidadCombo: { [docId: string]: 'contado' | 'credito' } = {};

  constructor(
    private combos: Combos,
    private productos: Productos,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      const combos = await this.combos.obtenerCombo();
      const productos = await this.productos.obtenerProductos();

      // ADAPTO LOS COMBOS PARA MANEJAR CONTADO Y CREDITO
      this.comboLista = combos.map((combo: any) => {

        const vendeContado =
          combo.vendeContado ??
          (
            combo.tipo === 'contado' ||
            combo.tipo === 'ambos' ||
            (!combo.tipo && combo.precio != null)
          );

        const vendeCredito =
          combo.vendeCredito ??
          (
            combo.tipo === 'credito' ||
            combo.tipo === 'ambos'
          );

        const precioContado =
          combo.precioContado ??
          (combo.tipo !== 'credito' ? combo.precio : null);

        const precioCredito =
          combo.precioCredito ??
          (combo.tipo !== 'contado' ? combo.precio : null);

        const comboAdaptado = {
          ...combo,
          vendeContado,
          vendeCredito,
          precioContado,
          precioCredito,
          imagenActiva: combo.imagen
        };

        const id = String(combo.docId ?? combo.id);

        // INICIO EN CREDITO SI ESTA DISPONIBLE
        if (vendeCredito) {
          this.modalidadCombo[id] = 'credito';
        } else if (vendeContado) {
          this.modalidadCombo[id] = 'contado';
        }

        return comboAdaptado;
      });

      this.productosLista = productos;

      this.cdr.detectChanges();
      this.restaurarProducto();

    } catch (error) {
      console.error('Error cargando combos:', error);
    }
  }

  obtenerProducto(docId: string) {
    return this.productosLista.find(
      producto => producto.docId === docId
    );
  }

  // CAMBIO LA MODALIDAD DEL COMBO
  seleccionarModalidad(
    combo: any,
    modalidad: 'contado' | 'credito'
  ) {
    const id = String(combo.docId ?? combo.id);

    if (modalidad === 'contado' && combo.vendeContado) {
      this.modalidadCombo[id] = 'contado';
    }

    if (modalidad === 'credito' && combo.vendeCredito) {
      this.modalidadCombo[id] = 'credito';
    }
  }

  // OBTENGO LA MODALIDAD SELECCIONADA
  obtenerModalidad(combo: any): 'contado' | 'credito' {
    const id = String(combo.docId ?? combo.id);

    return this.modalidadCombo[id] ??
      (combo.vendeCredito ? 'credito' : 'contado');
  }

  verDetalleCombo(docId: string) {
    this.combos.productoParaVolver = docId;
    this.router.navigate(['/combo-detalle', docId]);
  }

  // OBTENGO EL PRECIO SEGUN LA MODALIDAD
  precioFinal(
    combo: any,
    modalidad: 'contado' | 'credito'
  ): number {
    const precio = modalidad === 'contado'
      ? (combo.precioContado ?? combo.precio)
      : (combo.precioCredito ?? combo.precio);

    return Number(precio) || 0;
  }

  restaurarProducto() {
    const docId = this.combos.productoParaVolver;

    if (!docId) return;

    let intentos = 0;
    const maxIntentos = 20;

    const buscarCombo = () => {
      const combo = document.getElementById('producto-' + docId);

      if (combo) {
        combo.scrollIntoView({
          behavior: 'auto',
          block: 'center'
        });

        this.combos.productoParaVolver = null;
        return;
      }

      intentos++;

      if (intentos < maxIntentos) {
        setTimeout(buscarCombo, 150);
      }
    };

    setTimeout(buscarCombo, 100);
  }

  // GENERO EL MENSAJE DE WHATSAPP CON LA MODALIDAD ELEGIDA
  obtenerLinkWhatsApp(combo: any): string {
    const modalidad = this.obtenerModalidad(combo);
    const precio = this.precioFinal(combo, modalidad);

    const nombreModalidad =
      modalidad === 'contado' ? 'contado' : 'credito';

    let mensaje =
      `Hola! Estoy interesado en el combo ${combo.nombre}. ` +
      `Precio de ${nombreModalidad}: ${precio.toLocaleString('es-CO')} pesos.`;

    if (modalidad === 'credito') {
      if (combo.inicial != null) {
        mensaje +=
          ` Cuota inicial: ${Number(combo.inicial).toLocaleString('es-CO')} pesos.`;
      }

      if (combo.quincenal != null) {
        mensaje +=
          ` Pago quincenal: ${Number(combo.quincenal).toLocaleString('es-CO')} pesos.`;
      }
    }

    return `https://wa.me/573137110232?text=${encodeURIComponent(mensaje)}`;
  }
}

