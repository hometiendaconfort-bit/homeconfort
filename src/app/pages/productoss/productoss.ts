
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

        // Adaptar productos nuevos y antiguos.
        this.productos = data.map(p => {

          const vendeContado = p.vendeContado ??
            (p.tipo === 'contado' || p.tipo === 'ambos');

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
            imagenes,
            imagenActiva: imagenes.length
              ? imagenes[0]
              : p.imagen
          };
        });

        // Obtener los colores disponibles.
        this.colores = Array.from(
          new Set(this.productos.map(p => p.color))
        ).filter(c => c);

        // Filtrar productos por búsqueda, modalidad y color.
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

        // Restaurar el scroll hasta el producto.
        setTimeout(() => {
          this.restaurarProducto();
        }, 100);
      },

      error: err => console.error('Error cargando productos', err)
    });
  }

  // Filtrar por modalidad y color.
  filtrar(tipo: string, color: string): void {

    this.tipoSeleccionado$.next(tipo);
    this.colorSeleccionado$.next(color);

    this.tipoActual = tipo;
    this.colorActual = color;
  }

  // Cambiar la imagen principal del producto.
  cambiarImagen(p: any, img: string): void {
    p.imagenActiva = img;
  }

  // Aplicar descuento únicamente al precio de contado.
  precioFinal(p: any, modalidad?: string): number {

    const modo = modalidad && modalidad !== 'todos'
      ? modalidad
      : p.vendeContado
        ? 'contado'
        : 'credito';

    // Obtener el precio de la modalidad seleccionada.
    const precio = modo === 'credito'
      ? p.precioCredito
      : p.precioContado;

    const precioBase = Number(precio ?? p.precio ?? 0);

    // El precio a crédito no recibe descuento.
    if (modo === 'credito') {
      return precioBase;
    }

    // El descuento se aplica solamente al contado.
    const descuento = Number(p.descuento ?? 0);

    return p.oferta || descuento > 0
      ? precioBase - (precioBase * descuento / 100)
      : precioBase;
  }

  // Crear enlace de WhatsApp con la modalidad seleccionada.
  obtenerLinkWhatsApp(p: any): string {

    const modalidad = this.tipoActual === 'todos'
      ? (p.vendeContado ? 'contado' : 'credito')
      : this.tipoActual;

    const precio = this.precioFinal(p, modalidad);

    const mensaje =
      `Hola! Estoy interesado en ${p.nombre}. ` +
      `Forma de pago: ${modalidad}. ` +
      `Precio: ${precio}.`;

    return `https://wa.me/573137110232?text=${encodeURIComponent(mensaje)}`;
  }

  // Ir al detalle del producto y guardar su ID para volver.
  verDetalle(id: number): void {
    this.productosService.productoParaVolver = id;
    this.router.navigate(['/productos', id]);
  }

  // Identificar cada producto en la lista.
  productosId(_index: number, item: any): number {
    return item.id;
  }

  // Restaurar el scroll hasta el producto seleccionado.
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
