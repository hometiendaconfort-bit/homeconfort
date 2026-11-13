
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject,
  PendingTasks
} from '@angular/core';

import { CommonModule, DOCUMENT } from '@angular/common';
import { Combos } from '../services/combos';
import { ProductosService } from '../services/producto.service';
import { Router } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-combos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './combos.html',
  styleUrl: './combos.css',
})
export class CombosComponent implements OnInit, OnDestroy {

  private readonly document = inject(DOCUMENT);

  comboLista: any[] = [];
  productosLista: any[] = [];

  descripcion: string = 'Combos a Credito y Contado';

  private readonly urlBase = 'https://homeconfort.pages.dev';
  private readonly urlCombos = 'https://homeconfort.pages.dev/combos';

  private seoScript?: HTMLScriptElement;

  modalidadCombo: {
    [docId: string]: 'contado' | 'credito'
  } = {};

  frecuenciaCombo: {
    [docId: string]: 'quincenal' | 'mensual'
  } = {};

  constructor(
    private combos: Combos,
    private productos: ProductosService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private title: Title,
    private meta: Meta,
    private pendingTasks: PendingTasks
  ) {}

  // INICIALIZACIÓN
  ngOnInit(): void {

    this.actualizarSEO();

    // CARGAR COMBOS Y ESPERAR A QUE TERMINE LA CONSULTA
    this.pendingTasks.run(() =>
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

          this.actualizarDatosEstructurados();

          this.cdr.detectChanges();

          this.restaurarProducto();

        })
        .catch((error: unknown) => {
          console.error('Error cargando combos:', error);
        })
    );

    // CARGAR PRODUCTOS Y ESPERAR A QUE TERMINE LA CONSULTA
    this.pendingTasks.run(() =>
      this.productos.obtenerProductos()
        .then((productos: any[]) => {

          this.productosLista = productos;

          this.cdr.detectChanges();

        })
        .catch((error: unknown) => {
          console.error('Error cargando productos:', error);
        })
    );
  }

  // SEO DE LA PÁGINA DE COMBOS
  private actualizarSEO(): void {

    const titulo =
      'Combos especiales de camas y colchones | Home Confort';

    const descripcionSEO =
      'Descubre los combos especiales de Home Confort. Conoce nuestras combinaciones de productos para tu habitación y consulta sus detalles y opciones de compra.';

    this.title.setTitle(titulo);

    this.meta.updateTag({
      name: 'description',
      content: descripcionSEO
    });

    this.meta.updateTag({
      name: 'robots',
      content: 'index, follow, max-image-preview:large'
    });

    this.meta.updateTag({
      name: 'googlebot',
      content: 'index, follow'
    });

    // OPEN GRAPH
    this.meta.updateTag({
      property: 'og:type',
      content: 'website'
    });

    this.meta.updateTag({
      property: 'og:title',
      content: titulo
    });

    this.meta.updateTag({
      property: 'og:description',
      content: descripcionSEO
    });

    this.meta.updateTag({
      property: 'og:url',
      content: this.urlCombos
    });

    this.meta.updateTag({
      property: 'og:site_name',
      content: 'Home Confort'
    });

    this.meta.updateTag({
      property: 'og:locale',
      content: 'es_CO'
    });

    // TWITTER
    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary'
    });

    this.meta.updateTag({
      name: 'twitter:title',
      content: titulo
    });

    this.meta.updateTag({
      name: 'twitter:description',
      content: descripcionSEO
    });

    // URL CANÓNICA
    let canonical = this.document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;

    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.rel = 'canonical';
      this.document.head.appendChild(canonical);
    }

    canonical.href = this.urlCombos;
  }

  // DATOS ESTRUCTURADOS DE LA COLECCIÓN
  private actualizarDatosEstructurados(): void {

    const elementos = this.comboLista.map(
      (combo: any, index: number) => {

        const id = combo.docId ?? combo.id;

        return {
          '@type': 'ListItem',
          position: index + 1,
          name: combo.nombre || 'Combo especial',
          url: `${this.urlBase}/combo-detalle/${encodeURIComponent(String(id))}`
        };
      }
    );

    const datosEstructurados = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Combos especiales | Home Confort',
      description:
        'Colección de combos especiales de Home Confort.',
      url: this.urlCombos,
      inLanguage: 'es-CO',
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: elementos.length,
        itemListElement: elementos
      }
    };

    let script = this.document.getElementById(
      'seo-combos-jsonld'
    ) as HTMLScriptElement | null;

    if (!script) {
      script = this.document.createElement('script');
      script.id = 'seo-combos-jsonld';
      script.type = 'application/ld+json';
      this.document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(datosEstructurados)
      .replace(/</g, '\\u003c');

    this.seoScript = script;
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

      const combo = this.document.getElementById('producto-' + docId);

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

  // LIMPIAR DATOS ESTRUCTURADOS AL SALIR
  ngOnDestroy(): void {

    if (this.seoScript) {
      this.seoScript.remove();
    }
  }
}
