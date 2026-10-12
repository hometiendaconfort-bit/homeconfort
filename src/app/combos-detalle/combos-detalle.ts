import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Combos } from '../services/combos';
import { Productos } from '../services/productos';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-combo-detalle',
  imports: [CommonModule, RouterModule],
  templateUrl: './combos-detalle.html',
  styleUrl: './combos-detalle.css',
})

export class ComboDetalleComponent implements OnInit {

  // Aquí guardamos el combo seleccionado
  combo: any;

  // Aquí guardamos todos los productos
  productosLista: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private combos: Combos,
    private productos: Productos,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private location: Location
    
  ) {}

  async ngOnInit() {

    try {

      // Obtiene el docId que viene en la URL
      const docId = this.route.snapshot.paramMap.get('id');

      // Obtiene todos los combos
      const combos = await this.combos.obtenerCombo();

      // Obtiene todos los productos
      const productos = await this.productos.obtenerProductos();

      // Guarda los productos
      this.productosLista = productos;

      // Busca el combo seleccionado
      this.combo = combos.find(
        combo => combo.docId === docId
      );

      // Si encontró el combo
      if (this.combo) {

        // Imagen inicial del combo
        this.combo.imagenActiva = this.combo.imagen;

      }

      // Actualiza la vista
      this.cdr.detectChanges();

    } catch (error) {

      console.error('Error cargando el combo:', error);

    }

  }


  // Busca un producto por su docId
  obtenerProducto(docId: string) {

    return this.productosLista.find(
      producto => producto.docId === docId
    );

  }


  // Cambia la imagen principal
  cambiarImagen(combo: any, imagen: string) {

    combo.imagenActiva = imagen;

  }

  volver() {
  this.location.back();
}



  // Genera el enlace de WhatsApp
  obtenerLinkWhatsApp(combo: any): string {

    const mensaje =
      `Hola! Estoy interesado en el combo ${combo.nombre} con precio ${combo.precio}`;

    return `https://wa.me/573137110232?text=${encodeURIComponent(mensaje)}`;

  }

}