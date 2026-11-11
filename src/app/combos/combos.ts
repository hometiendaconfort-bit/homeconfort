
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Combos } from '../services/combos';
import { Productos } from '../services/productos';
import { Router } from '@angular/router';

@Component({
  selector: 'app-combos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './combos.html',
  styleUrl: './combos.css',
})
export class CombosComponent implements OnInit {

  comboLista: any[] = [];
  productosLista: any[] = [];

  descripcion: string = 'Combos a Credito y Contado';

  // MODALIDAD SELECCIONADA PARA CADA COMBO
  modalidadCombo: {
    [docId: string]: 'contado' | 'credito'
  } = {};

  // FRECUENCIA DE PAGO SELECCIONADA
  frecuenciaCombo: {
    [docId: string]: 'quincenal' | 'mensual'
  } = {};

  constructor(
    private combos: Combos,
    private productos: Productos,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  // CARGA INDEPENDIENTE DE COMBOS Y PRODUCTOS
  ngOnInit(): void {

    // CARGAR COMBOS
    this.combos.obtenerCombo()
      .then((combos: any[]) => {

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

          // COMPATIBILIDAD CON COMBOS ANTIGUOS
          const vendeQuincenal =
            combo.vendeQuincenal ??
            (Number(combo.quincenal) > 0);

          const vendeMensual =
            combo.vendeMensual ??
            (Number(combo.mensual) > 0);

          // ALMOHADAS
          const incluyeAlmohadas =
            combo.incluyeAlmohadas ?? false;

          const cantidadAlmohadas =
            incluyeAlmohadas
              ? Math.max(
                  0,
                  Math.floor(Number(combo.cantidadAlmohadas) || 0)
                )
              : 0;

          const comboAdaptado = {
            ...combo,
            vendeContado,
            vendeCredito,
            precioContado,
            precioCredito,
            vendeQuincenal,
            vendeMensual,
            incluyeAlmohadas,
            cantidadAlmohadas,
            imagenActiva: combo.imagen
          };

          const id = String(combo.docId ?? combo.id);

          // INICIAR EN CRÉDITO SI ESTÁ DISPONIBLE
          if (vendeCredito) {
            this.modalidadCombo[id] = 'credito';
          } else if (vendeContado) {
            this.modalidadCombo[id] = 'contado';
          }

          // FRECUENCIA DISPONIBLE
          if (vendeQuincenal) {
            this.frecuenciaCombo[id] = 'quincenal';
          } else if (vendeMensual) {
            this.frecuenciaCombo[id] = 'mensual';
          }

          return comboAdaptado;
        });

        this.cdr.detectChanges();
        this.restaurarProducto();

      })
      .catch((error: unknown) => {
        console.error('Error cargando combos:', error);
      });

    // CARGAR PRODUCTOS SIN ESPERAR A LOS COMBOS
    this.productos.obtenerProductos()
      .then((productos: any[]) => {

        this.productosLista = productos;

        this.cdr.detectChanges();

      })
      .catch((error: unknown) => {
        console.error('Error cargando productos:', error);
      });
  }

  // OBTENER UN PRODUCTO POR SU ID DE FIRESTORE
  obtenerProducto(docId: string) {
    return this.productosLista.find(
      producto => producto.docId === docId
    );
  }

  // CAMBIAR MODALIDAD DEL COMBO
  seleccionarModalidad(
    combo: any,
    modalidad: 'contado' | 'credito'
  ): void {

    const id = String(combo.docId ?? combo.id);

    if (modalidad === 'contado' && combo.vendeContado) {
      this.modalidadCombo[id] = 'contado';
    }

    if (modalidad === 'credito' && combo.vendeCredito) {
      this.modalidadCombo[id] = 'credito';
    }
  }

  // OBTENER MODALIDAD SELECCIONADA
  obtenerModalidad(combo: any): 'contado' | 'credito' {

    const id = String(combo.docId ?? combo.id);

    return this.modalidadCombo[id] ??
      (combo.vendeCredito ? 'credito' : 'contado');
  }

  // CAMBIAR FRECUENCIA DE PAGO
  seleccionarFrecuencia(
    combo: any,
    frecuencia: 'quincenal' | 'mensual'
  ): void {

    const id = String(combo.docId ?? combo.id);

    if (frecuencia === 'quincenal' && combo.vendeQuincenal) {
      this.frecuenciaCombo[id] = 'quincenal';
    }

    if (frecuencia === 'mensual' && combo.vendeMensual) {
      this.frecuenciaCombo[id] = 'mensual';
    }
  }

  // OBTENER FRECUENCIA SELECCIONADA
  obtenerFrecuencia(combo: any): 'quincenal' | 'mensual' {

    const id = String(combo.docId ?? combo.id);

    return this.frecuenciaCombo[id] ??
      (combo.vendeQuincenal ? 'quincenal' : 'mensual');
  }

  // ABRIR DETALLE DEL COMBO
  verDetalleCombo(docId: string): void {

    this.combos.productoParaVolver = docId;

    this.router.navigate(['/combo-detalle', docId]);
  }

  // OBTENER PRECIO SEGÚN MODALIDAD
  precioFinal(
    combo: any,
    modalidad: 'contado' | 'credito'
  ): number {

    const precio = modalidad === 'contado'
      ? (combo.precioContado ?? combo.precio)
      : (combo.precioCredito ?? combo.precio);

    return Number(precio) || 0;
  }

  // RESTAURAR POSICIÓN DEL COMBO AL VOLVER DEL DETALLE
  restaurarProducto(): void {

    const docId = this.combos.productoParaVolver;

    if (!docId) return;

    let intentos = 0;
    const maxIntentos = 20;

    const buscarCombo = (): void => {

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

  // GENERAR MENSAJE DE WHATSAPP
  obtenerLinkWhatsApp(combo: any): string {

    const modalidad = this.obtenerModalidad(combo);

    const precio = this.precioFinal(combo, modalidad);

    const nombreModalidad =
      modalidad === 'contado' ? 'contado' : 'credito';

    let mensaje =
      `Hola! Estoy interesado en el combo ${combo.nombre}. ` +
      `Precio de ${nombreModalidad}: ${precio.toLocaleString('es-CO')} pesos.`;

    // INFORMACIÓN DE ALMOHADAS
    if (combo.incluyeAlmohadas && combo.cantidadAlmohadas > 0) {

      const cantidad = combo.cantidadAlmohadas;

      const textoAlmohadas = cantidad === 1
        ? 'almohada'
        : 'almohadas';

      mensaje += ` Incluye ${cantidad} ${textoAlmohadas}.`;
    }

    // INFORMACIÓN DEL CRÉDITO
    if (modalidad === 'credito') {

      if (combo.inicial != null) {

        mensaje +=
          ` Cuota inicial: ${Number(combo.inicial).toLocaleString('es-CO')} pesos.`;
      }

      const frecuencia = this.obtenerFrecuencia(combo);

      if (frecuencia === 'quincenal' && combo.vendeQuincenal) {

        if (combo.quincenal != null) {

          mensaje +=
            ` Pago quincenal: ${Number(combo.quincenal).toLocaleString('es-CO')} pesos.`;
        }

        if (combo.cuotasQuincenales != null) {

          mensaje +=
            ` Número de cuotas quincenales: ${combo.cuotasQuincenales}.`;
        }

      } else if (frecuencia === 'mensual' && combo.vendeMensual) {

        if (combo.mensual != null) {

          mensaje +=
            ` Pago mensual: ${Number(combo.mensual).toLocaleString('es-CO')} pesos.`;
        }

        if (combo.cuotasMensuales != null) {

          mensaje +=
            ` Número de cuotas mensuales: ${combo.cuotasMensuales}.`;
        }
      }
    }

    return `https://wa.me/573137110232?text=${encodeURIComponent(mensaje)}`;
  }
}
