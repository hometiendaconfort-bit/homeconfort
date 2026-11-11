
import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  RouterOutlet,
  Router,
  NavigationEnd,
  ActivatedRoute
} from '@angular/router';

import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { Inject } from '@angular/core';
import { filter, Subscription } from 'rxjs';

import { Navbar } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Footer],

  template: `
    <app-navbar></app-navbar>
    <router-outlet></router-outlet>
    <app-footer></app-footer>
  `
})
export class App implements OnInit, OnDestroy {

  private navegacionSubscription?: Subscription;

  private readonly dominio = 'https://homeconfort.pages.dev';

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private title: Title,
    private meta: Meta,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {

    // SEO inicial
    this.actualizarSEO();

    // Actualizar SEO al cambiar de página
    this.navegacionSubscription = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.actualizarSEO();
      });
  }

  ngOnDestroy(): void {
    this.navegacionSubscription?.unsubscribe();
  }

  private actualizarSEO(): void {

    let ruta = this.activatedRoute;

    // Buscar la ruta más profunda
    while (ruta.firstChild) {
      ruta = ruta.firstChild;
    }

    const url = this.router.url.split('?')[0].split('#')[0];

    const robots = ruta.snapshot.data['robots'] || 'index, follow';

    let titulo = 'Camas, colchones y muebles en Pereira y Dosquebradas | Home Confort';

    let descripcion =
      'Encuentra camas, colchones, bases cama y muebles para tu hogar en Home Confort. Atención en Pereira y Dosquebradas, con envíos a Colombia.';

    // SEO según la ruta
    if (url === '/home' || url === '/') {

      titulo = 'Camas, colchones y muebles en Pereira y Dosquebradas | Home Confort';

      descripcion =
        'Compra camas, colchones, bases cama y muebles para tu hogar en Home Confort. Atención en Pereira y Dosquebradas, con envíos a Colombia.';

    } else if (url === '/productoss') {

      titulo = 'Catálogo de camas, colchones y muebles | Home Confort';

      descripcion =
        'Explora nuestro catálogo de camas, colchones, bases cama y muebles para el hogar. Encuentra opciones de contado y crédito en Home Confort.';

    } else if (url.startsWith('/categoria/')) {

      const categoria = decodeURIComponent(url.split('/')[2] || '')
        .replace(/-/g, ' ');

      const categoriaTexto = categoria
        .split(' ')
        .map(palabra =>
          palabra.charAt(0).toUpperCase() + palabra.slice(1)
        )
        .join(' ');

      titulo = `${categoriaTexto} en Pereira y Dosquebradas | Home Confort`;

      descripcion =
        `Encuentra ${categoria} para tu hogar en Home Confort. Consulta nuestro catálogo y opciones de compra con atención en Pereira y Dosquebradas.`;

    } else if (url === '/combos') {

      titulo = 'Combos de camas y colchones | Home Confort';

      descripcion =
        'Descubre combos de camas, colchones y muebles para tu hogar. Consulta precios y opciones de compra en Home Confort.';

    } else if (url === '/quienesSomos') {

      titulo = 'Quiénes somos | Home Confort';

      descripcion =
        'Conoce Home Confort, tienda online de camas, colchones y muebles para el hogar con atención en Pereira, Dosquebradas y envíos a Colombia.';

    } else if (url === '/requisitos') {

      titulo = 'Requisitos de compra a crédito | Home Confort';

      descripcion =
        'Consulta los requisitos y condiciones para comprar tus productos a crédito en Home Confort.';

    } else if (url === '/carrito') {

      titulo = 'Carrito de compras | Home Confort';

      descripcion =
        'Revisa los productos seleccionados en tu carrito de compras de Home Confort.';

    } else if (url.startsWith('/productos/')) {

      titulo = 'Detalle del producto | Home Confort';

      descripcion =
        'Consulta los detalles, características y opciones de compra de nuestros productos en Home Confort.';

    } else if (url.startsWith('/combos/')) {

      titulo = 'Detalle del combo | Home Confort';

      descripcion =
        'Conoce los detalles y opciones de compra de nuestros combos para el hogar en Home Confort.';

    } else if (url.startsWith('/combo-detalle/')) {

      titulo = 'Detalle del combo | Home Confort';

      descripcion =
        'Consulta las características y opciones de compra de este combo en Home Confort.';

    } else if (
      url.startsWith('/login') ||
      url.startsWith('/admin')
    ) {

      titulo = 'Administración | Home Confort';

      descripcion = 'Panel de administración de Home Confort.';
    }

    // Actualizar título
    this.title.setTitle(titulo);

    // Actualizar descripción
    this.meta.updateTag({
      name: 'description',
      content: descripcion
    });

    // Actualizar robots
    this.meta.updateTag({
      name: 'robots',
      content: robots
    });

    this.meta.updateTag({
      name: 'googlebot',
      content: robots
    });

    // Construir URL canónica
    const canonicalUrl = `${this.dominio}${url}`;

    let canonical = this.document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement | null;

    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      this.document.head.appendChild(canonical);
    }

    canonical.setAttribute('href', canonicalUrl);

    // Open Graph
    this.meta.updateTag({
      property: 'og:type',
      content: 'website'
    });

    this.meta.updateTag({
      property: 'og:locale',
      content: 'es_CO'
    });

    this.meta.updateTag({
      property: 'og:site_name',
      content: 'Home Confort'
    });

    this.meta.updateTag({
      property: 'og:title',
      content: titulo
    });

    this.meta.updateTag({
      property: 'og:description',
      content: descripcion
    });

    this.meta.updateTag({
      property: 'og:url',
      content: canonicalUrl
    });

    this.meta.updateTag({
      property: 'og:image',
      content: `${this.dominio}/assets/img/logo2.jpeg`
    });

    // Twitter
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
      content: descripcion
    });

    this.meta.updateTag({
      name: 'twitter:image',
      content: `${this.dominio}/assets/img/logo2.jpeg`
    });
  }
}

