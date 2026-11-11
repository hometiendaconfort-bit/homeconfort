
import { Component, OnInit } from '@angular/core';
import {
  RouterOutlet,
  Router,
  NavigationEnd,
  ActivatedRoute
} from '@angular/router';

import { Meta } from '@angular/platform-browser';
import { filter } from 'rxjs';

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

export class App implements OnInit {

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private meta: Meta
  ) {}

  ngOnInit(): void {

    // CONFIGURACIÓN INICIAL
    this.actualizarRobots();

    // DETECTAR CAMBIOS DE RUTA
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.actualizarRobots();
      });
  }

  private actualizarRobots(): void {

    let ruta = this.activatedRoute;

    // BUSCAR LA RUTA MÁS PROFUNDA
    while (ruta.firstChild) {
      ruta = ruta.firstChild;
    }

    // LEER LA CONFIGURACIÓN SEO DE LA RUTA
    const robots = ruta.snapshot.data['robots'] || 'index, follow';

    // ACTUALIZAR META ROBOTS
    this.meta.updateTag({
      name: 'robots',
      content: robots
    });
  }
}
