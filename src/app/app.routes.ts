
import { Routes } from '@angular/router';

import { NotFound } from './pages/not-found/not-found';
import { Home } from './pages/home/home';
import { Requisitos } from './components/requisitos/requisitos';
import { Carrucel } from './components/carrucel/carrucel';
import { CombosComponent } from './combos/combos';
import { QuienesSomos } from './quienes-somos/quienes-somos';
import { Productoss } from './pages/productoss/productoss';
import { productsResolver } from './products-resolver';
import { ProductoDetalleComponent } from './components/producto-detalle/producto-detalle';
import { ComboDetalleComponent } from './combos-detalle/combos-detalle';
import { CarritoPage } from './pages/carrito/carrito';

// LOGIN Y SEGURIDAD
import { Login } from './pages/login/login';
import { authGuard } from './guards/auth-guard';
import { Admin } from './pages/admin/admin';
import { AdminProductos } from './pages/admin-productos/admin-productos';
import { AdminCarrucel } from './pages/admin-carrucel/admin-carrucel';
import { AdminCombos } from './admin-combos/admin-combos';

export const routes: Routes = [

  // REDIRECCIÓN PRINCIPAL
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  // PÁGINA PRINCIPAL
  {
    path: 'home',
    component: Home,
 resolve: {
      productos: productsResolver
    }
  },

  // REQUISITOS
  {
    path: 'requisitos',
    component: Requisitos
  },

  // CATÁLOGO GENERAL
  {
    path: 'productoss',
    component: Productoss,
    resolve: {
      productos: productsResolver
    }
  },

  // CATÁLOGO POR CATEGORÍA
  {
    path: 'categoria/:slug',
    component: Productoss,
    resolve: {
      productos: productsResolver
    }
  },

  // CARRITO: NO INDEXAR
  {
    path: 'carrito',
    component: CarritoPage,
    data: { robots: 'noindex, follow' }
  },

  // CARRUSEL
  {
    path: 'carrucel',
    component: Carrucel
  },

  // COMBOS
  {
    path: 'combos',
    component: CombosComponent
  },

  // QUIÉNES SOMOS
  {
    path: 'quienesSomos',
    component: QuienesSomos
  },

  // DETALLE DE PRODUCTOS
  {
    path: 'productos/:id',
    component: ProductoDetalleComponent
  },

  // COMBOS POR ID
  {
    path: 'combos/:id',
    component: CombosComponent
  },

  // DETALLE DE COMBOS
  {
    path: 'combo-detalle/:id',
    component: ComboDetalleComponent
  },

  // LOGIN: NO INDEXAR
  {
    path: 'login',
    component: Login,
    data: { robots: 'noindex, follow' }
  },

  // ADMINISTRACIÓN: PROTEGIDA Y NO INDEXABLE
  {
    path: 'admin',
    component: Admin,
    canActivate: [authGuard],
    data: { robots: 'noindex, follow' }
  },

  {
    path: 'admin-productos',
    component: AdminProductos,
    canActivate: [authGuard],
    data: { robots: 'noindex, follow' }
  },

  {
    path: 'admin-carrucel',
    component: AdminCarrucel,
    canActivate: [authGuard],
    data: { robots: 'noindex, follow' }
  },

  {
    path: 'admin-combos',
    component: AdminCombos,
    canActivate: [authGuard],
    data: { robots: 'noindex, follow' }
  },

  // PÁGINA 404: NO INDEXAR
  {
    path: '**',
    component: NotFound,
    data: { robots: 'noindex, follow' }
  }

];
