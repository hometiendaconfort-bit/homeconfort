
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductosService } from '../../services/producto.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-producto-detalle',
  imports: [CommonModule, RouterModule],
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
    const id = this.route.snapshot.paramMap.get('id');

    this.productosService.getProductos().subscribe(res => {
      const encontrado = res.find(
        p => String(p.id) === String(id)
      );

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

  // CALCULAR EL PRECIO FINAL SEGÚN LA MODALIDAD
  precioFinal(p: any, modalidad: string = 'contado'): any {

    // OBTENER EL PRECIO DE LA MODALIDAD
    const precioBase = Number(
      modalidad === 'credito'
        ? (p.precioCredito ?? p.precio)
        : (p.precioContado ?? p.precio)
    ) || 0;

    // EL CRÉDITO NO TIENE DESCUENTO
    if (modalidad === 'credito') {
      return precioBase;
    }

    // CALCULAR EL DESCUENTO DE CONTADO
    const descuento = Number(p.descuento) || 0;

    if (p.oferta || descuento > 0) {
      return precioBase - (precioBase * descuento / 100);
    }

    return precioBase;
  }

  // GENERAR EL MENSAJE DE WHATSAPP
  obtenerLinkWhatsApp(p: any): string {

    const modalidad = p.vendeContado ? 'contado' : 'credito';

    const precio = this.precioFinal(p, modalidad);

    const nombreModalidad = modalidad === 'contado'
      ? 'contado'
      : 'crédito';

    const mensaje =
      `Hola! Estoy interesado en el producto ${p.nombre}. ` +
      `Precio de ${nombreModalidad}: ${precio.toLocaleString('es-CO')} pesos.`;

    return `https://wa.me/573137110232?text=${encodeURIComponent(mensaje)}`;
  }

}
