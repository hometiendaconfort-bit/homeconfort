
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ProductosService } from '../../services/producto.service';
import { SearchService } from '../../services/search.service';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

@Component({
  selector: 'app-productoss',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './productoss.html',
  styleUrls: ['./productoss.css']
})
export class Productoss implements OnInit {

  productos: any[] = [];
  colores: string[] = [];
  slug: string | null = null;

  // GUARDO LA MODALIDAD SELECCIONADA PARA CADA PRODUCTO
  modalidadProducto: { [id: string]: 'contado' | 'credito' } = {};

  tipoSeleccionado$ = new BehaviorSubject<string>('todos');
  colorSeleccionado$ = new BehaviorSubject<string>('todos');

  tipoActual = 'todos';
  colorActual = 'todos';

  productosFiltrados$!: Observable<any[]>;

  constructor(
    private productosService: ProductosService,
    private route: ActivatedRoute,
    private searchService: SearchService,
    private router: Router
  ) {}

  ngOnInit(): void {

    this.slug = this.route.snapshot.paramMap.get('slug');

    // LEER EL FILTRO DE MODALIDAD DESDE LA URL
    this.route.queryParams.subscribe(params => {
      const tipo = params['tipo'];

      if (
        tipo === 'contado' ||
        tipo === 'credito' ||
        tipo === 'todos'
      ) {
        this.filtrar(tipo, this.colorActual);
      }
    });

    this.productosService.getProductos().subscribe({

      next: data => {

        // ADAPTO PRODUCTOS NUEVOS Y ANTIGUOS DE FIREBASE
        this.productos = data.map(p => {

          const vendeContado = p.vendeContado ??
            (p.tipo === 'contado' || p.tipo === 'ambos' ||
             (!p.tipo && p.precio != null));

          const vendeCredito = p.vendeCredito ??
            (p.tipo === 'credito' || p.tipo === 'ambos');

          const precioContado = p.precioContado ??
            (p.tipo !== 'credito' ? p.precio : null);

          const precioCredito = p.precioCredito ??
            (p.tipo !== 'contado' ? p.precio : null);

          const imagenes = Array.isArray(p.imagenes)
            ? p.imagenes
            : [];

          return {
            ...p,
            vendeContado,
            vendeCredito,
            precioContado,
            precioCredito,

            // COMPATIBILIDAD CON PRODUCTOS ANTIGUOS
            frecuenciaPago: p.frecuenciaPago === 'mensual'
              ? 'mensual'
              : 'quincenal',

            mensual: Number(p.mensual ?? 0),
            quincenal: Number(p.quincenal ?? 0),
            numeroCuotas: Number(p.numeroCuotas ?? 0),

            imagenes,
            imagenActiva: imagenes.length
              ? imagenes[0]
              : p.imagen
          };
        });

        // INICIAR EN CREDITO SI ESTA DISPONIBLE
        this.productos.forEach(p => {

          const id = String(p.id);

          if (p.vendeCredito) {
            this.modalidadProducto[id] = 'credito';
          } else if (p.vendeContado) {
            this.modalidadProducto[id] = 'contado';
          }

        });

        // OBTENER LOS COLORES DISPONIBLES
        this.colores = Array.from(
          new Set(this.productos.map(p => p.color))
        ).filter(c => c);

        // FILTRAR POR BUSQUEDA, MODALIDAD Y COLOR
        this.productosFiltrados$ = combineLatest([
          this.searchService.search$,
          this.tipoSeleccionado$,
          this.colorSeleccionado$
        ]).pipe(

          map(([textoBusqueda, tipo, color]) => {

            const txt = (textoBusqueda || '').toLowerCase().trim();

            return this.productos.filter(p => {

              const categoriaOk = this.slug
                ? p.categoria === this.slug
                : true;

              const tipoOk = tipo === 'todos'
                ? true
                : tipo === 'contado'
                  ? p.vendeContado
                  : p.vendeCredito;

              const colorOk = color === 'todos'
                ? true
                : p.color === color;

              const textoOk = !txt || (
                (p.nombre && p.nombre.toLowerCase().includes(txt)) ||
                (p.categoria && p.categoria.toLowerCase().includes(txt)) ||
                (p.tipo && p.tipo.toLowerCase().includes(txt)) ||
                (p.color && p.color.toLowerCase().includes(txt)) ||
                (p.descripcion &&
                  p.descripcion.toLowerCase().includes(txt))
              );

              return categoriaOk && tipoOk && colorOk && textoOk;

            });
          })
        );

        // RESTAURAR EL SCROLL HASTA EL PRODUCTO SELECCIONADO
        setTimeout(() => {
          this.restaurarProducto();
        }, 100);

      },

      error: err => console.error('Error cargando productos', err)

    });
  }

  // FILTRAR PRODUCTOS POR MODALIDAD Y COLOR
  filtrar(tipo: string, color: string): void {

    this.tipoSeleccionado$.next(tipo);
    this.colorSeleccionado$.next(color);

    this.tipoActual = tipo;
    this.colorActual = color;
  }

  // CAMBIAR LA MODALIDAD DEL PRODUCTO
  seleccionarModalidad(
    p: any,
    modalidad: 'contado' | 'credito'
  ): void {

    const id = String(p.id);

    if (modalidad === 'contado' && p.vendeContado) {
      this.modalidadProducto[id] = 'contado';
    }

    if (modalidad === 'credito' && p.vendeCredito) {
      this.modalidadProducto[id] = 'credito';
    }
  }

  // OBTENER LA MODALIDAD SELECCIONADA
  obtenerModalidad(p: any): 'contado' | 'credito' {

    const id = String(p.id);

    return this.modalidadProducto[id] ??
      (p.vendeCredito ? 'credito' : 'contado');
  }

  // CAMBIAR LA IMAGEN PRINCIPAL DEL PRODUCTO
  cambiarImagen(p: any, img: string): void {
    p.imagenActiva = img;
  }

  // OBTENER EL PRECIO ORIGINAL ANTES DEL DESCUENTO
  precioOriginal(p: any): number {
    return Number(p.precioContado ?? p.precio ?? 0);
  }

  // CALCULAR EL PRECIO SEGUN LA MODALIDAD
  // EL DESCUENTO SOLO SE APLICA A CONTADO
  precioFinal(p: any, modalidad?: string): number {

    const modo = modalidad && modalidad !== 'todos'
      ? modalidad
      : this.obtenerModalidad(p);

    const precio = modo === 'credito'
      ? p.precioCredito
      : p.precioContado;

    const precioBase = Number(precio ?? p.precio ?? 0);

    if (modo === 'credito') {
      return precioBase;
    }

    const descuento = Number(p.descuento ?? 0);

    return p.oferta || descuento > 0
      ? precioBase - (precioBase * descuento / 100)
      : precioBase;
  }

  // GENERAR EL MENSAJE DE WHATSAPP CON LA MODALIDAD ELEGIDA
  obtenerLinkWhatsApp(p: any): string {

    const modalidad = this.obtenerModalidad(p);
    const precio = this.precioFinal(p, modalidad);

    const precioTexto = precio.toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    });

    let mensaje =
      `Hola, estoy interesado en ${p.nombre}. ` +
      `Quiero comprarlo ${modalidad === 'contado' ? 'de contado' : 'a crédito'}. ` +
      `Precio: ${precioTexto}.`;

    // INCLUIR LOS VALORES DE FINANCIACION SI ES CREDITO
    if (modalidad === 'credito') {

      if (p.inicial != null && Number(p.inicial) > 0) {
        mensaje += ` Inicial: ${Number(p.inicial).toLocaleString('es-CO', {
          style: 'currency',
          currency: 'COP',
          maximumFractionDigits: 0
        })}.`;
      }

      // MOSTRAR LA CUOTA SEGUN LA FRECUENCIA CONFIGURADA
      const frecuencia = p.frecuenciaPago === 'mensual'
        ? 'mensual'
        : 'quincenal';

      const valorCuota = frecuencia === 'mensual'
        ? Number(p.mensual ?? 0)
        : Number(p.quincenal ?? 0);

      if (valorCuota > 0) {
        mensaje += ` Cuota ${frecuencia}: ${valorCuota.toLocaleString('es-CO', {
          style: 'currency',
          currency: 'COP',
          maximumFractionDigits: 0
        })}.`;
      }

      // MOSTRAR EL NUMERO DE CUOTAS SI ESTA CONFIGURADO
      if (Number(p.numeroCuotas) > 0) {
        mensaje += ` Número de cuotas: ${p.numeroCuotas}.`;
      }
    }

    return `https://wa.me/573137110232?text=${encodeURIComponent(mensaje)}`;
  }

  // IR AL DETALLE Y GUARDAR EL ID PARA VOLVER AL MISMO PRODUCTO
  verDetalle(id: number): void {
    this.productosService.productoParaVolver = id;
    this.router.navigate(['/productos', id]);
  }

  // IDENTIFICAR CADA PRODUCTO EN LA LISTA
  productosId(_index: number, item: any): number {
    return item.id;
  }

  // RESTAURAR EL SCROLL HASTA EL PRODUCTO SELECCIONADO
  restaurarProducto(): void {

    const id = this.productosService.productoParaVolver;

    if (id == null) return;

    let intentos = 0;
    const maxIntentos = 20;

    const buscarProducto = () => {

      const elemento = document.getElementById('producto-' + id);

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
