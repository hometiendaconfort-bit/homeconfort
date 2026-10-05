import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ProductosService } from '../../services/producto.service';
import { RouterModule } from '@angular/router';
import { Location } from '@angular/common';

@Component({
  selector: 'app-producto-detalle',
  imports: [ CommonModule, RouterModule],
  templateUrl: './producto-detalle.html',
  styleUrl: './producto-detalle.css',
})

export class ProductoDetalleComponent implements OnInit {

producto: any;

constructor(
private route: ActivatedRoute,
private productosService: ProductosService,
private location: Location
) { }

ngOnInit(): void {
  const id = +this.route.snapshot.paramMap.get('id')!;

  this.productosService.getProductos().subscribe(res => {
    const encontrado = res.find(p => p.id == id);

    if (encontrado) {
      this.producto = {
        ...encontrado,
        imagenActiva: encontrado.imagenes?.[0] || encontrado.imagen
      };
    }
  });
}

cambiarImagen(p: any, img: string) {
  p.imagenActiva = img;
}

volver() {
  this.location.back();
}

precioFinal(p: any): number {
  return p.oferta ? p.precio - (p.precio * p.descuento / 100) : p.precio;
}

obtenerLinkWhatsApp(p: any): string {
  const mensaje = `Hola! Estoy interesado en el producto ${p.nombre} con precio ${this.precioFinal(p)}`;
    return `https://wa.me/573001234567?text=${encodeURIComponent(mensaje)}`;
}

}
