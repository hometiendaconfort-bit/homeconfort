import { Routes } from '@angular/router';
import { Home } from './pages/home/home';

import { Requisitos } from './components/requisitos/requisitos';
import { Carrucel } from './components/carrucel/carrucel';
import { CombosComponent } from './combos/combos';
import { QuienesSomos } from './quienes-somos/quienes-somos';
import { Productoss } from './pages/productoss/productoss';
import { productsResolver } from './products-resolver';
import { ProductoDetalleComponent } from './components/producto-detalle/producto-detalle';
import { ComboDetalleComponent } from './combos-detalle/combos-detalle';

//IMPORT DE LOS SERVICIOS
import { Productos } from './services/productos';
import { CarrucelService } from './services/carrucel.service';


//IMPORT DE LOS COMPONENTES DEL LOGIN Y LA SEGURIDAD DE LAS RUTAS
import { Login } from './pages/login/login';
import { authGuard } from './guards/auth-guard';
import { Admin } from './pages/admin/admin';
import { AdminProductos } from './pages/admin-productos/admin-productos';
import { AdminCarrucel } from './pages/admin-carrucel/admin-carrucel';
import { AdminCombos } from './admin-combos/admin-combos';


export const routes: Routes = [

  //CONEXION PRINCIPAL DE LA PAGINA

  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },

  {
    path: 'home',
    component: Home,
    resolve: { productos: productsResolver }
  },


   {
     path: 'requisitos', 
     component: Requisitos
   },

   {
     path: 'carrucel',
     component: Carrucel
  },

  {
     path: 'combos',
     component: CombosComponent
  },

  {
     path: 'quienesSomos',
     component: QuienesSomos
  },

  {
     path: 'productoss',
     component: Productoss
  },

  { 
     path: 'categoria/:slug',
     component: Productoss 
  },

  { 
     path: 'productos/:id',
     component: ProductoDetalleComponent 

  },

   {
  path: 'combos/:id',
  component: CombosComponent
},

  {
  path: 'combo-detalle/:id',
  component: ComboDetalleComponent
},


//CONEXION DE LOS SERVICIOS

  {
     path: 'productos',
     component: Productos
  },

  {
     path: 'carrucel',
     component: CarrucelService
  },


//CONEXION CON EL ADMIN LOGIN

  {
     path: 'login',
     component: Login
  },

  {
     path: 'admin',
     component: Admin,
     canActivate: [authGuard]
  },

  {
     path: 'admin-productos',
     component: AdminProductos,
     canActivate: [authGuard]
  
  },

  {
     path: 'admin-carrucel',
     component: AdminCarrucel,
     canActivate: [authGuard]
  
  },

  {
     path: 'admin-combos',
     component: AdminCombos,
     canActivate: [authGuard]
  
  }

];


