
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { CarruselCategorias } from '../../components/carrusel-categorias/carrusel-categorias';
import { ProductosService } from '../../services/producto.service';
import { SearchService } from '../../services/search.service';
import { Carrito, ProductoCarrito } from '../../services/carrito';

import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  Subject,
  takeUntil
} from 'rxjs';

type Modalidad = 'contado' | 'credito';
type Frecuencia = 'quincenal' | 'mensual';

interface VarianteColor {
  color: string;
  imagen: string;
  imagenes: string[];
  imagenesTexto?: string;
}

@Component({
  selector: 'app-productoss',
  standalone: true,
  imports: [CommonModule, RouterModule, CarruselCategorias],
  templateUrl: './productoss.html',
  styleUrls: ['./productoss.css']
})
export class Productoss implements OnInit, OnDestroy {

  productos: any[] = [];
  colores: string[] = [];
  slug: string | null = null;

  modalidadProducto: { [id: string]: Modalidad } = {};
  frecuenciaProducto: { [id: string]: Frecuencia } = {};
  varianteSeleccionada: { [id: string]: number } = {};
  imagenSeleccionada: { [id: string]: string } = {};

  tipoSeleccionado$ = new BehaviorSubject<string>('todos');
  colorSeleccionado$ = new BehaviorSubject<string>('todos');

  tipoActual = 'todos';
  colorActual = 'todos';

  productosFiltrados$!: Observable<any[]>;

  private destruir$ = new Subject<void>();

  constructor(
    private productosService: ProductosService,
    private route: ActivatedRoute,
    private searchService: SearchService,
    private router: Router,
    private carrito: Carrito
  ) {}

  ngOnInit(): void {

    // LEER CATEGORÍA DESDE LA RUTA.
    this.route.paramMap
      .pipe(takeUntil(this.destruir$))
      .subscribe(params => {

        this.slug =
          params.get('slug') ||
          params.get('categoria');

        this.actualizarProductosFiltrados();
      });

    // LEER FILTROS DESDE LA URL.
    this.route.queryParamMap
      .pipe(takeUntil(this.destruir$))
      .subscribe(params => {

        if (
          params.has('categoria') ||
          params.has('slug')
        ) {
          this.slug =
            params.get('categoria') ||
            params.get('slug');

          this.actualizarProductosFiltrados();
        }

        const tipo = params.get('tipo');

        if (
          tipo === 'contado' ||
          tipo === 'credito' ||
          tipo === 'todos'
        ) {
          this.filtrar(tipo, this.colorActual);
        }
      });

    // RECIBIR LOS PRODUCTOS CARGADOS POR EL RESOLVER.
    this.route.data
      .pipe(takeUntil(this.destruir$))
      .subscribe({

        next: data => {

          const productosRecibidos = data['productos'];

          if (!Array.isArray(productosRecibidos)) {
            console.error(
              'El resolver no entregó una lista válida de productos.'
            );
            this.productos = [];
            this.actualizarProductosFiltrados();
            return;
          }

          this.procesarProductos(productosRecibidos);
        },

        error: err => {
          console.error('Error recibiendo productos del resolver:', err);
        }

      });
  }

  ngOnDestroy(): void {

    this.destruir$.next();
    this.destruir$.complete();
  }

  // PROCESAR Y NORMALIZAR PRODUCTOS.
  private procesarProductos(data: any[]): void {

    this.productos = data.map(p => {

      const vendeContado =
        p.vendeContado ??
        (
          p.tipo === 'contado' ||
          p.tipo === 'ambos' ||
          (!p.tipo && p.precio != null)
        );

      const vendeCredito =
        p.vendeCredito ??
        (
          p.tipo === 'credito' ||
          p.tipo === 'ambos'
        );

      const precioContado =
        p.precioContado ??
        (p.tipo !== 'credito' ? p.precio ?? null : null);

      const precioCredito =
        p.precioCredito ??
        (p.tipo !== 'contado' ? p.precio ?? null : null);

      const frecuenciaAntigua: Frecuencia =
        p.frecuenciaPago === 'mensual'
          ? 'mensual'
          : 'quincenal';

      const variantesColor: VarianteColor[] =
        Array.isArray(p.variantesColor) &&
        p.variantesColor.length > 0

          ? p.variantesColor.map((v: any) => {

              const imagenPrincipal =
                String(v.imagen ?? '').trim();

              const adicionales = Array.isArray(v.imagenes)
                ? v.imagenes
                : String(v.imagenesTexto ?? '')
                    .split(',')
                    .map((url: string) => url.trim())
                    .filter(Boolean);

              const imagenes = [
                ...new Set(
                  [imagenPrincipal, ...adicionales].filter(Boolean)
                )
              ];

              return {
                color: String(v.color ?? '').trim(),
                imagen: imagenPrincipal,
                imagenes,
                imagenesTexto: imagenes
                  .filter(url => url !== imagenPrincipal)
                  .join(', ')
              };
            })

          : [{
              color: String(p.color ?? '').trim(),
              imagen: String(p.imagen ?? '').trim(),
              imagenes: this.normalizarImagenesAntiguas(p),
              imagenesTexto: ''
            }];

      const imagenes = Array.isArray(p.imagenes)
        ? p.imagenes
        : [];

      const quincenal = Number(p.quincenal ?? 0);
      const mensual = Number(p.mensual ?? 0);

      const numeroCuotasQuincenal = Number(
        p.numeroCuotasQuincenal ??
        (
          frecuenciaAntigua === 'quincenal'
            ? p.numeroCuotas ?? 0
            : 0
        )
      );

      const numeroCuotasMensual = Number(
        p.numeroCuotasMensual ??
        (
          frecuenciaAntigua === 'mensual'
            ? p.numeroCuotas ?? 0
            : 0
        )
      );

      return {
        ...p,
        vendeContado,
        vendeCredito,
        precioContado,
        precioCredito,
        inicial: Number(p.inicial ?? 0),
        quincenal,
        mensual,
        numeroCuotasQuincenal,
        numeroCuotasMensual,
        frecuenciaPago: frecuenciaAntigua,
        numeroCuotas: Number(p.numeroCuotas ?? 0),
        variantesColor,
        imagenes,
        imagenActiva:
          p.imagenActiva ||
          (imagenes.length ? imagenes[0] : p.imagen)
      };
    });

    // CONFIGURAR VARIANTES, IMÁGENES Y MODALIDADES.
    this.productos.forEach(p => {

      const id = String(p.id);

      this.varianteSeleccionada[id] = 0;

      const primeraVariante = p.variantesColor?.[0];

      const primeraImagen =
        primeraVariante?.imagen ||
        p.imagenActiva ||
        p.imagen ||
        '';

      this.imagenSeleccionada[id] = primeraImagen;

      if (p.vendeCredito) {
        this.modalidadProducto[id] = 'credito';
      } else if (p.vendeContado) {
        this.modalidadProducto[id] = 'contado';
      }

      if (p.mensual > 0 && p.quincenal <= 0) {
        this.frecuenciaProducto[id] = 'mensual';
      } else if (
        p.frecuenciaPago === 'mensual' &&
        p.mensual > 0
      ) {
        this.frecuenciaProducto[id] = 'mensual';
      } else {
        this.frecuenciaProducto[id] = 'quincenal';
      }
    });

    // OBTENER COLORES DISPONIBLES.
    this.colores = Array.from(
      new Set(
        this.productos.flatMap(p =>
          p.variantesColor?.length
            ? p.variantesColor.map(
                (v: VarianteColor) => v.color
              )
            : [p.color]
        )
      )
    ).filter(Boolean);

    this.actualizarProductosFiltrados();

    setTimeout(() => this.restaurarProducto(), 100);
  }

  // NORMALIZAR CATEGORÍAS.
  private normalizarCategoria(valor: unknown): string {

    return String(valor ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ');
  }

  // CONVERTIR COLOR A CSS.
  obtenerColorCSS(color: string): string {

    const nombre = (color || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');

    const coloresCSS: Record<string, string> = {
      blanco: '#ffffff',
      negro: '#171717',
      gris: '#808080',
      'gris claro': '#d3d3d3',
      'gris oscuro': '#454545',
      cafe: '#795548',
      marron: '#795548',
      beige: '#d8c3a5',
      rojo: '#e53935',
      azul: '#1976d2',
      verde: '#388e3c',
      rosado: '#e8a0b4',
      rosa: '#e8a0b4',
      dorado: '#c9a227',
      plateado: '#c0c0c0',
      morado: '#800080',
      amarillo: '#fdd835',
      naranja: '#ef6c00'
    };

    return coloresCSS[nombre] || '#d9d9d9';
  }

  // ACTUALIZAR PRODUCTOS FILTRADOS.
  private actualizarProductosFiltrados(): void {

    this.productosFiltrados$ = combineLatest([
      this.searchService.search$,
      this.tipoSeleccionado$,
      this.colorSeleccionado$
    ]).pipe(

      map(([textoBusqueda, tipo, color]) => {

        const txt = (textoBusqueda || '')
          .toLowerCase()
          .trim();

        const categoriaFiltro =
          this.normalizarCategoria(this.slug);

        return this.productos.filter(p => {

          const categoriaProducto =
            this.normalizarCategoria(p.categoria);

          const categoriaOk = categoriaFiltro
            ? categoriaProducto === categoriaFiltro
            : true;

          const tipoOk =
            tipo === 'todos'
              ? true
              : tipo === 'contado'
                ? p.vendeContado
                : p.vendeCredito;

          const coloresProducto: string[] =
            p.variantesColor?.length
              ? p.variantesColor.map(
                  (v: VarianteColor) => v.color
                )
              : [p.color];

          const colorOk =
            color === 'todos' ||
            coloresProducto.includes(color);

          const textoOk =
            !txt ||
            String(p.nombre ?? '')
              .toLowerCase()
              .includes(txt) ||
            String(p.categoria ?? '')
              .toLowerCase()
              .includes(txt) ||
            String(p.tipo ?? '')
              .toLowerCase()
              .includes(txt) ||
            String(p.descripcion ?? '')
              .toLowerCase()
              .includes(txt) ||
            coloresProducto.some(c =>
              String(c ?? '').toLowerCase().includes(txt)
            );

          return (
            categoriaOk &&
            tipoOk &&
            colorOk &&
            textoOk
          );
        });
      })
    );
  }

  // NORMALIZAR IMÁGENES ANTIGUAS.
  private normalizarImagenesAntiguas(p: any): string[] {

    const principal = String(p.imagen ?? '').trim();

    const adicionales: string[] = Array.isArray(p.imagenes)
      ? p.imagenes
      : [];

    return [
      ...new Set(
        [principal, ...adicionales]
          .map(url => String(url ?? '').trim())
          .filter(Boolean)
      )
    ];
  }

  // OBTENER VARIANTE ACTIVA.
  obtenerVarianteActiva(p: any): VarianteColor | null {

    const variantes: VarianteColor[] = p.variantesColor ?? [];

    if (!variantes.length) return null;

    const indice = this.varianteSeleccionada[String(p.id)] ?? 0;

    return variantes[indice] ?? variantes[0];
  }

  // SELECCIONAR COLOR.
  seleccionarColor(p: any, indice: number): void {

    const variantes: VarianteColor[] = p.variantesColor ?? [];

    if (!variantes[indice]) return;

    const id = String(p.id);

    this.varianteSeleccionada[id] = indice;

    const imagen =
      variantes[indice].imagen ||
      variantes[indice].imagenes?.[0] ||
      '';

    this.imagenSeleccionada[id] = imagen;
    p.imagenActiva = imagen;
  }

  // COMPROBAR VARIANTE ACTIVA.
  esVarianteActiva(p: any, indice: number): boolean {

    return (
      (this.varianteSeleccionada[String(p.id)] ?? 0) === indice
    );
  }

  // OBTENER IMÁGENES ACTIVAS.
  obtenerImagenesActivas(p: any): string[] {

    const variante = this.obtenerVarianteActiva(p);

    if (variante) {
      return variante.imagenes?.length
        ? variante.imagenes
        : variante.imagen
          ? [variante.imagen]
          : [];
    }

    return this.normalizarImagenesAntiguas(p);
  }

  // OBTENER IMAGEN ACTIVA.
  obtenerImagenActiva(p: any): string {

    const id = String(p.id);
    const imagenElegida = this.imagenSeleccionada[id];
    const imagenes = this.obtenerImagenesActivas(p);

    if (imagenElegida && imagenes.includes(imagenElegida)) {
      return imagenElegida;
    }

    return imagenes[0] || p.imagenActiva || p.imagen || '';
  }

  // SELECCIONAR IMAGEN.
  seleccionarImagen(p: any, imagen: string): void {

    const id = String(p.id);

    this.imagenSeleccionada[id] = imagen;
    p.imagenActiva = imagen;
  }

  // FILTRAR PRODUCTOS.
  filtrar(tipo: string, color: string): void {

    this.tipoSeleccionado$.next(tipo);
    this.colorSeleccionado$.next(color);

    this.tipoActual = tipo;
    this.colorActual = color;
  }

  // SELECCIONAR MODALIDAD.
  seleccionarModalidad(
    p: any,
    modalidad: Modalidad
  ): void {

    const id = String(p.id);

    if (modalidad === 'contado' && p.vendeContado) {
      this.modalidadProducto[id] = 'contado';
    }

    if (modalidad === 'credito' && p.vendeCredito) {
      this.modalidadProducto[id] = 'credito';
    }
  }

  // OBTENER MODALIDAD.
  obtenerModalidad(p: any): Modalidad {

    const id = String(p.id);

    return this.modalidadProducto[id] ??
      (p.vendeCredito ? 'credito' : 'contado');
  }

  // SELECCIONAR FRECUENCIA.
  seleccionarFrecuencia(
    p: any,
    frecuencia: Frecuencia
  ): void {

    if (
      frecuencia === 'quincenal' &&
      Number(p.quincenal) > 0
    ) {
      this.frecuenciaProducto[String(p.id)] = 'quincenal';
    }

    if (
      frecuencia === 'mensual' &&
      Number(p.mensual) > 0
    ) {
      this.frecuenciaProducto[String(p.id)] = 'mensual';
    }
  }

  // OBTENER FRECUENCIA.
  obtenerFrecuencia(p: any): Frecuencia {

    const id = String(p.id);
    const seleccionada = this.frecuenciaProducto[id];

    if (
      seleccionada === 'mensual' &&
      Number(p.mensual) > 0
    ) {
      return 'mensual';
    }

    if (
      seleccionada === 'quincenal' &&
      Number(p.quincenal) > 0
    ) {
      return 'quincenal';
    }

    return Number(p.quincenal) > 0
      ? 'quincenal'
      : 'mensual';
  }

  // OBTENER VALOR DE CUOTA.
  obtenerValorCuota(p: any): number {

    return this.obtenerFrecuencia(p) === 'mensual'
      ? Number(p.mensual ?? 0)
      : Number(p.quincenal ?? 0);
  }

  // OBTENER NÚMERO DE CUOTAS.
  obtenerNumeroCuotas(p: any): number {

    return this.obtenerFrecuencia(p) === 'mensual'
      ? Number(p.numeroCuotasMensual ?? 0)
      : Number(p.numeroCuotasQuincenal ?? 0);
  }

  // CAMBIAR IMAGEN.
  cambiarImagen(p: any, img: string): void {

    this.seleccionarImagen(p, img);
  }

  // PRECIO ORIGINAL.
  precioOriginal(p: any): number {

    return Number(p.precioContado ?? p.precio ?? 0);
  }

  // CALCULAR PRECIO FINAL.
  precioFinal(p: any, modalidad?: string): number {

    const modo =
      modalidad && modalidad !== 'todos'
        ? modalidad
        : this.obtenerModalidad(p);

    const precio =
      modo === 'credito'
        ? p.precioCredito
        : p.precioContado;

    const precioBase = Number(precio ?? p.precio ?? 0);

    if (modo === 'credito') return precioBase;

    const descuento = Number(p.descuento ?? 0);

    return p.oferta || descuento > 0
      ? precioBase - precioBase * descuento / 100
      : precioBase;
  }

  // FORMATEAR PRECIO.
  private formatearPrecio(valor: number): string {

    return Number(valor || 0).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    });
  }

  // ENVIAR PRODUCTO INDIVIDUAL POR WHATSAPP.
  obtenerLinkWhatsApp(p: any): string {

    const modalidad = this.obtenerModalidad(p);
    const precio = this.precioFinal(p, modalidad);
    const variante = this.obtenerVarianteActiva(p);

    let mensaje = `Hola, estoy interesado en ${p.nombre}. `;

    if (variante?.color) {
      mensaje += `Color seleccionado: ${variante.color}. `;
    }

    mensaje +=
      `Quiero comprarlo ${
        modalidad === 'contado' ? 'de contado' : 'a crédito'
      }. Precio: ${this.formatearPrecio(precio)}.`;

    if (modalidad === 'credito') {

      if (Number(p.inicial) > 0) {
        mensaje +=
          ` Inicial: ${this.formatearPrecio(Number(p.inicial))}.`;
      }

      const frecuencia = this.obtenerFrecuencia(p);
      const valorCuota = this.obtenerValorCuota(p);
      const numeroCuotas = this.obtenerNumeroCuotas(p);

      if (valorCuota > 0) {
        mensaje +=
          ` Cuota ${frecuencia}: ${this.formatearPrecio(valorCuota)}.`;
      }

      if (numeroCuotas > 0) {
        mensaje +=
          ` Número de cuotas ${frecuencia}: ${numeroCuotas}.`;
      }
    }

    return `https://wa.me/573137110232?text=${encodeURIComponent(mensaje)}`;
  }

  // =====================================
  // CARRITO DE COMPRAS
  // =====================================

  agregarAlCarrito(p: any): void {

    if (!p) {
      alert('No se pudo identificar el producto.');
      return;
    }

    const modalidad = this.obtenerModalidad(p);
    const frecuencia = this.obtenerFrecuencia(p);
    const variante = this.obtenerVarianteActiva(p);

    const color = variante?.color || p.color || 'Sin especificar';

    const id = String(p.id ?? p.docId ?? p.nombre);

    const clave = [
      id,
      modalidad,
      color,
      modalidad === 'credito' ? frecuencia : 'unico'
    ].join('-');

    const nuevoProducto: ProductoCarrito = {

      clave,

      id: p.id ?? p.docId ?? p.nombre,

      nombre: p.nombre,

      imagen: this.obtenerImagenActiva(p),

      color,

      modalidad,

      precio: this.precioFinal(p, modalidad),

      inicial: modalidad === 'credito'
        ? Number(p.inicial ?? 0)
        : 0,

      frecuencia,

      valorCuota: modalidad === 'credito'
        ? this.obtenerValorCuota(p)
        : 0,

      numeroCuotas: modalidad === 'credito'
        ? this.obtenerNumeroCuotas(p)
        : 0,

      cantidad: 1
    };

    this.carrito.agregarProducto(nuevoProducto);

    alert('¡Producto agregado al carrito!');
  }

  // VER DETALLE DEL PRODUCTO.
  verDetalle(id: number | string): void {

    this.productosService.productoParaVolver = id as number;

    this.router.navigate(['/productos', id]);
  }

  // IDENTIFICAR PRODUCTOS EN LA LISTA.
  productosId(_index: number, item: any): number {

    return item.id;
  }

  // RESTAURAR POSICIÓN DEL PRODUCTO.
  restaurarProducto(): void {

    const id = this.productosService.productoParaVolver;

    if (id == null) return;

    let intentos = 0;
    const maxIntentos = 20;

    const buscarProducto = () => {

      const elemento = document.getElementById(`producto-${id}`);

      if (elemento) {

        elemento.scrollIntoView({
          behavior: 'auto',
          block: 'center'
        });

        this.productosService.productoParaVolver = null;

        return;
      }

      intentos++;

      if (intentos < maxIntentos) {
        setTimeout(buscarProducto, 150);
      }
    };

    setTimeout(buscarProducto, 100);
  }

}
