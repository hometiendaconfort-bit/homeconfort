
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ProductosService } from '../../services/producto.service';
import { SearchService } from '../../services/search.service';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';

type Modalidad = 'contado' | 'credito';
type Frecuencia = 'quincenal' | 'mensual';

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

  // MODALIDAD SELECCIONADA PARA CADA PRODUCTO
  modalidadProducto: { [id: string]: Modalidad } = {};

  // FRECUENCIA SELECCIONADA PARA CADA PRODUCTO
  frecuenciaProducto: { [id: string]: Frecuencia } = {};

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

        // ADAPTAR PRODUCTOS NUEVOS Y ANTIGUOS DE FIREBASE
        this.productos = data.map(p => {

          const vendeContado = p.vendeContado ??
            (
              p.tipo === 'contado' ||
              p.tipo === 'ambos' ||
              (!p.tipo && p.precio != null)
            );

          const vendeCredito = p.vendeCredito ??
            (
              p.tipo === 'credito' ||
              p.tipo === 'ambos'
            );

          const precioContado = p.precioContado ??
            (p.tipo !== 'credito' ? p.precio ?? null : null);

          const precioCredito = p.precioCredito ??
            (p.tipo !== 'contado' ? p.precio ?? null : null);

          const imagenes = Array.isArray(p.imagenes)
            ? p.imagenes
            : [];

          // CONSERVAR LA FRECUENCIA DE LOS PRODUCTOS ANTIGUOS
          const frecuenciaAntigua: Frecuencia =
            p.frecuenciaPago === 'mensual'
              ? 'mensual'
              : 'quincenal';

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
            imagenes,
            imagenActiva: p.imagenActiva ||
              (imagenes.length ? imagenes[0] : p.imagen)
          };
        });

        // SELECCIONAR LA MODALIDAD Y FRECUENCIA INICIAL
        this.productos.forEach(p => {

          const id = String(p.id);

          if (p.vendeCredito) {
            this.modalidadProducto[id] = 'credito';
          } else if (p.vendeContado) {
            this.modalidadProducto[id] = 'contado';
          }

          // SI SOLO EXISTE PAGO MENSUAL, SELECCIONARLO
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

        // OBTENER LOS COLORES DISPONIBLES
        this.colores = Array.from(
          new Set(this.productos.map(p => p.color))
        ).filter(c => c);

        // FILTRAR POR BÚSQUEDA, MODALIDAD Y COLOR
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
  seleccionarModalidad(p: any, modalidad: Modalidad): void {

    const id = String(p.id);

    if (modalidad === 'contado' && p.vendeContado) {
      this.modalidadProducto[id] = 'contado';
    }

    if (modalidad === 'credito' && p.vendeCredito) {
      this.modalidadProducto[id] = 'credito';
    }
  }

  // OBTENER LA MODALIDAD SELECCIONADA
  obtenerModalidad(p: any): Modalidad {

    const id = String(p.id);

    return this.modalidadProducto[id] ??
      (p.vendeCredito ? 'credito' : 'contado');
  }

  // CAMBIAR LA FRECUENCIA DEL CRÉDITO
  seleccionarFrecuencia(p: any, frecuencia: Frecuencia): void {

    if (frecuencia === 'quincenal' && Number(p.quincenal) > 0) {
      this.frecuenciaProducto[String(p.id)] = 'quincenal';
    }

    if (frecuencia === 'mensual' && Number(p.mensual) > 0) {
      this.frecuenciaProducto[String(p.id)] = 'mensual';
    }
  }

  // OBTENER LA FRECUENCIA SELECCIONADA
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

    // USAR LA OTRA FRECUENCIA SI LA SELECCIONADA NO ESTÁ DISPONIBLE
    if (Number(p.quincenal) > 0) {
      return 'quincenal';
    }

    return 'mensual';
  }

  // OBTENER EL VALOR DE LA CUOTA SELECCIONADA
  obtenerValorCuota(p: any): number {

    return this.obtenerFrecuencia(p) === 'mensual'
      ? Number(p.mensual ?? 0)
      : Number(p.quincenal ?? 0);
  }

  // OBTENER EL NÚMERO DE CUOTAS DE LA FRECUENCIA SELECCIONADA
  obtenerNumeroCuotas(p: any): number {

    return this.obtenerFrecuencia(p) === 'mensual'
      ? Number(p.numeroCuotasMensual ?? 0)
      : Number(p.numeroCuotasQuincenal ?? 0);
  }

  // CAMBIAR LA IMAGEN PRINCIPAL DEL PRODUCTO
  cambiarImagen(p: any, img: string): void {
    p.imagenActiva = img;
  }

  // OBTENER EL PRECIO ORIGINAL ANTES DEL DESCUENTO
  precioOriginal(p: any): number {
    return Number(p.precioContado ?? p.precio ?? 0);
  }

  // CALCULAR EL PRECIO SEGÚN LA MODALIDAD
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

  // FORMATEAR VALORES EN PESOS COLOMBIANOS
  private formatearPrecio(valor: number): string {

    return Number(valor || 0).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    });
  }

  // GENERAR EL MENSAJE DE WHATSAPP CON LA MODALIDAD ELEGIDA
  obtenerLinkWhatsApp(p: any): string {

    const modalidad = this.obtenerModalidad(p);
    const precio = this.precioFinal(p, modalidad);

    let mensaje =
      `Hola, estoy interesado en ${p.nombre}. ` +
      `Quiero comprarlo ${modalidad === 'contado' ? 'de contado' : 'a crédito'}. ` +
      `Precio: ${this.formatearPrecio(precio)}.`;

    if (modalidad === 'credito') {

      if (Number(p.inicial) > 0) {
        mensaje += ` Inicial: ${this.formatearPrecio(Number(p.inicial))}.`;
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

    if (id == null) {
      return;
    }

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

