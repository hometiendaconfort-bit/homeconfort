
import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import {
  CommonModule,
  Location,
  DOCUMENT
} from '@angular/common';

import {
  ActivatedRoute,
  RouterModule
} from '@angular/router';

import { Title, Meta } from '@angular/platform-browser';

import { Combos } from '../services/combos';
import { ProductosService } from '../services/producto.service';

@Component({
  selector: 'app-combo-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './combos-detalle.html',
  styleUrls: ['./combos-detalle.css']
})
export class ComboDetalleComponent implements OnInit, OnDestroy {

  combo: any = null;
  productosLista: any[] = [];

  modalidad: 'contado' | 'credito' = 'contado';
  frecuencia: 'quincenal' | 'mensual' = 'quincenal';

  private readonly urlBase = 'https://homeconfort.pages.dev';
  private seoScript?: HTMLScriptElement;

  // Inyección de DOCUMENT sin utilizar @Inject
  private document = inject(DOCUMENT);

  constructor(
    private route: ActivatedRoute,
    private combosService: Combos,
    private productosService: ProductosService,
    private cd: ChangeDetectorRef,
    private location: Location,
    private title: Title,
    private meta: Meta
  ) {}

  // ==================================================
  // INICIO
  // ==================================================

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarCombo();
  }

  ngOnDestroy(): void {
    if (this.seoScript?.parentNode) {
      this.seoScript.parentNode.removeChild(this.seoScript);
    }
  }

  // ==================================================
  // CARGAR COMBO
  // ==================================================

  private async cargarCombo(): Promise<void> {

    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.comboNoEncontrado();
      return;
    }

    try {

      const combos = await this.combosService.obtenerCombo();

      const encontrado = (combos || []).find(
        (item: any) => String(item.docId) === String(id)
      );

      if (!encontrado) {
        this.comboNoEncontrado();
        return;
      }

      this.combo = encontrado;

      this.adaptarComboAntiguo();

      this.actualizarSEO();

      this.cd.detectChanges();

    } catch (error) {

      console.error('Error al cargar el combo:', error);

      this.comboNoEncontrado();
    }
  }

  // ==================================================
  // CARGAR PRODUCTOS
  // ==================================================

  private async cargarProductos(): Promise<void> {

    try {

      const productos = await this.productosService.obtenerProductos();

      this.productosLista = productos || [];

      this.cd.detectChanges();

    } catch (error) {

      console.error('Error al cargar los productos:', error);

      this.productosLista = [];
    }
  }

  // ==================================================
  // ADAPTAR COMBOS ANTIGUOS
  // ==================================================

  private adaptarComboAntiguo(): void {

    if (!this.combo) {
      return;
    }

    this.combo.precioContado =
      this.combo.precioContado ?? this.combo.precio ?? 0;

    this.combo.precioCredito =
      this.combo.precioCredito ?? this.combo.precio ?? 0;

    this.combo.inicial =
      this.combo.inicial ?? this.combo.cuotaInicial ?? null;

    this.combo.quincenal =
      this.combo.quincenal ?? this.combo.valorQuincenal ?? null;

    this.combo.mensual =
      this.combo.mensual ?? this.combo.valorMensual ?? null;

    this.combo.cuotasQuincenales =
      this.combo.cuotasQuincenales ??
      this.combo.numeroCuotasQuincenales ??
      null;

    this.combo.cuotasMensuales =
      this.combo.cuotasMensuales ??
      this.combo.numeroCuotasMensuales ??
      null;

    this.combo.descuento = Number(this.combo.descuento) || 0;

    this.combo.cantidadAlmohadas =
      Number(
        this.combo.cantidadAlmohadas ??
        this.combo.almohadas ??
        0
      ) || 0;

    this.combo.incluyeAlmohadas =
      this.combo.incluyeAlmohadas ??
      this.combo.cantidadAlmohadas > 0;

    this.combo.vendeContado =
      this.combo.vendeContado ??
      Number(this.combo.precioContado) > 0;

    this.combo.vendeCredito =
      this.combo.vendeCredito ??
      Number(this.combo.precioCredito) > 0;

    this.combo.vendeQuincenal =
      this.combo.vendeQuincenal ??
      Number(this.combo.quincenal) > 0;

    this.combo.vendeMensual =
      this.combo.vendeMensual ??
      Number(this.combo.mensual) > 0;

    this.combo.imagenActiva =
      this.combo.imagenActiva || this.combo.imagen || '';

    if (this.combo.vendeContado && !this.combo.vendeCredito) {
      this.modalidad = 'contado';
    } else if (this.combo.vendeCredito && !this.combo.vendeContado) {
      this.modalidad = 'credito';
    } else {
      this.modalidad = 'contado';
    }

    if (this.combo.vendeQuincenal && !this.combo.vendeMensual) {
      this.frecuencia = 'quincenal';
    } else if (this.combo.vendeMensual && !this.combo.vendeQuincenal) {
      this.frecuencia = 'mensual';
    } else {
      this.frecuencia = 'quincenal';
    }
  }

  // ==================================================
  // BUSCAR PRODUCTOS
  // ==================================================

  obtenerProducto(docId: string): any {

    if (!docId || !this.productosLista.length) {
      return null;
    }

    return this.productosLista.find(
      (producto: any) =>
        String(producto.docId) === String(docId) ||
        String(producto.id) === String(docId)
    ) || null;
  }

  // ==================================================
  // CAMBIAR IMAGEN
  // ==================================================

  cambiarImagen(combo: any, imagen: string): void {

    if (!combo || !imagen) {
      return;
    }

    combo.imagenActiva = imagen;
  }

  // ==================================================
  // MODALIDAD
  // ==================================================

  seleccionarModalidad(modalidad: 'contado' | 'credito'): void {
    this.modalidad = modalidad;
  }

  // ==================================================
  // FRECUENCIA
  // ==================================================

  seleccionarFrecuencia(
    frecuencia: 'quincenal' | 'mensual'
  ): void {
    this.frecuencia = frecuencia;
  }

  obtenerFrecuencia(
    combo: any
  ): 'quincenal' | 'mensual' {
    return this.frecuencia;
  }

  // ==================================================
  // PRECIO CON DESCUENTO
  // ==================================================

  obtenerPrecio(combo: any): number {

    if (!combo) {
      return 0;
    }

    const precio = Number(
      combo.precioContado ?? combo.precio ?? 0
    );

    const descuento = Number(combo.descuento) || 0;

    if (precio <= 0) {
      return 0;
    }

    if (descuento <= 0) {
      return precio;
    }

    return precio - (precio * descuento / 100);
  }

  // ==================================================
  // FORMATO DE MONEDA
  // ==================================================

  private formatoPesos(valor: number): string {

    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Number(valor) || 0);
  }

  // ==================================================
  // WHATSAPP
  // ==================================================

  obtenerLinkWhatsApp(combo: any): string {

    if (!combo) {
      return 'https://wa.me/573137110232';
    }

    const nombre = combo.nombre || 'Combo de Home Confort';

    let mensaje = `Hola, estoy interesado en el ${nombre}.`;

    if (this.modalidad === 'contado') {

      const precio = this.obtenerPrecio(combo);

      mensaje += `\nModalidad: Contado.`;
      mensaje += `\nPrecio: ${this.formatoPesos(precio)}.`;

    } else {

      const precioCredito = Number(
        combo.precioCredito ?? combo.precio ?? 0
      );

      mensaje += `\nModalidad: Crédito.`;
      mensaje += `\nPrecio a crédito: ${this.formatoPesos(precioCredito)}.`;

      if (combo.inicial != null) {
        mensaje += `\nCuota inicial: ${this.formatoPesos(combo.inicial)}.`;
      }

      if (this.obtenerFrecuencia(combo) === 'quincenal') {

        if (combo.quincenal != null) {
          mensaje += `\nCuota quincenal: ${this.formatoPesos(combo.quincenal)}.`;
        }

        if (combo.cuotasQuincenales != null) {
          mensaje += `\nNúmero de cuotas quincenales: ${combo.cuotasQuincenales}.`;
        }

      } else {

        if (combo.mensual != null) {
          mensaje += `\nCuota mensual: ${this.formatoPesos(combo.mensual)}.`;
        }

        if (combo.cuotasMensuales != null) {
          mensaje += `\nNúmero de cuotas mensuales: ${combo.cuotasMensuales}.`;
        }
      }
    }

    if (combo.incluyeAlmohadas && combo.cantidadAlmohadas > 0) {
      mensaje += `\nIncluye ${combo.cantidadAlmohadas} almohada(s).`;
    }

    mensaje += '\n¿Me pueden dar más información?';

    return `https://wa.me/573137110232?text=${encodeURIComponent(mensaje)}`;
  }

  // ==================================================
  // VOLVER
  // ==================================================

  volver(): void {
    this.location.back();
  }

  // ==================================================
  // SEO
  // ==================================================

  private actualizarSEO(): void {

    if (!this.combo) {
      return;
    }

    const nombre = String(
      this.combo.nombre || 'Combo especial'
    ).trim();

    const descripcion = String(
      this.combo.descripcion ||
      `Conoce ${nombre}, uno de los combos especiales de Home Confort. Consulta sus opciones de compra y entrega por WhatsApp.`
    ).trim();

    const url = `${this.urlBase}/combo-detalle/${this.combo.docId}`;

    const imagen = this.obtenerUrlAbsoluta(
      this.combo.imagenActiva || this.combo.imagen
    );

    this.title.setTitle(`${nombre} | Home Confort`);

    this.meta.updateTag({
      name: 'description',
      content: descripcion
    });

    this.meta.updateTag({
      name: 'robots',
      content: 'index, follow, max-image-preview:large'
    });

    this.meta.updateTag({
      name: 'googlebot',
      content: 'index, follow, max-image-preview:large'
    });

    this.meta.updateTag({
      property: 'og:type',
      content: 'product'
    });

    this.meta.updateTag({
      property: 'og:title',
      content: `${nombre} | Home Confort`
    });

    this.meta.updateTag({
      property: 'og:description',
      content: descripcion
    });

    this.meta.updateTag({
      property: 'og:url',
      content: url
    });

    this.meta.updateTag({
      property: 'og:site_name',
      content: 'Home Confort'
    });

    this.meta.updateTag({
      property: 'og:locale',
      content: 'es_CO'
    });

    if (imagen) {
      this.meta.updateTag({
        property: 'og:image',
        content: imagen
      });
    }

    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image'
    });

    this.meta.updateTag({
      name: 'twitter:title',
      content: `${nombre} | Home Confort`
    });

    this.meta.updateTag({
      name: 'twitter:description',
      content: descripcion
    });

    if (imagen) {
      this.meta.updateTag({
        name: 'twitter:image',
        content: imagen
      });
    }

    this.actualizarCanonical(url);

    this.actualizarDatosEstructurados(
      nombre,
      descripcion,
      url,
      imagen
    );
  }

  // ==================================================
  // URL ABSOLUTA
  // ==================================================

  private obtenerUrlAbsoluta(imagen: string): string {

    if (!imagen) {
      return '';
    }

    try {
      return new URL(imagen, this.urlBase).href;
    } catch {
      return '';
    }
  }

  // ==================================================
  // CANONICAL
  // ==================================================

  private actualizarCanonical(url: string): void {

    let canonical = this.document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;

    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      this.document.head.appendChild(canonical);
    }

    canonical.setAttribute('href', url);
  }

  // ==================================================
  // DATOS ESTRUCTURADOS
  // ==================================================

  private actualizarDatosEstructurados(
    nombre: string,
    descripcion: string,
    url: string,
    imagen: string
  ): void {

    const ofertas: any[] = [];

    const precioContado = this.obtenerPrecio(this.combo);

    const precioCredito = Number(
      this.combo.precioCredito ?? this.combo.precio ?? 0
    );

    if (this.combo.vendeContado && precioContado > 0) {
      ofertas.push({
        '@type': 'Offer',
        priceCurrency: 'COP',
        price: precioContado,
        url
      });
    }

    if (this.combo.vendeCredito && precioCredito > 0) {
      ofertas.push({
        '@type': 'Offer',
        priceCurrency: 'COP',
        price: precioCredito,
        url
      });
    }

    const datosEstructurados: any = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: nombre,
      description: descripcion,
      url: url,
      brand: {
        '@type': 'Brand',
        name: 'Home Confort'
      }
    };

    if (imagen) {
      datosEstructurados.image = [imagen];
    }

    if (ofertas.length > 0) {
      datosEstructurados.offers =
        ofertas.length === 1 ? ofertas[0] : ofertas;
    }

    if (this.seoScript?.parentNode) {
      this.seoScript.parentNode.removeChild(this.seoScript);
    }

    this.seoScript = this.document.createElement('script');
    this.seoScript.type = 'application/ld+json';
    this.seoScript.id = 'seo-combo-detalle-jsonld';

    this.seoScript.textContent = JSON.stringify(
      datosEstructurados
    ).replace(/</g, '\\u003c');

    this.document.head.appendChild(this.seoScript);
  }

  // ==================================================
  // COMBO NO ENCONTRADO
  // ==================================================

  private comboNoEncontrado(): void {

    this.combo = null;

    this.title.setTitle('Combo no encontrado | Home Confort');

    this.meta.updateTag({
      name: 'description',
      content: 'El combo que buscas no se encuentra disponible en Home Confort.'
    });

    this.meta.updateTag({
      name: 'robots',
      content: 'noindex, nofollow'
    });

    this.meta.updateTag({
      name: 'googlebot',
      content: 'noindex, nofollow'
    });

    this.cd.detectChanges();
  }
}
