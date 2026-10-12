
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Combos } from '../services/combos';
import { Productos } from '../services/productos';
import { ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-combos',
  imports: [CommonModule],
  templateUrl: './combos.html',
  styleUrl: './combos.css',
})
export class CombosComponent implements OnInit {

  comboLista: any[] = [];
  productosLista: any[] = [];
  descripcion: string = 'combos a credito y contado';

  constructor(
    private combos: Combos,
    private productos: Productos,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  async ngOnInit() {

    try {

      const combos = await this.combos.obtenerCombo();
      const productos = await this.productos.obtenerProductos();

      // ADAPTO LOS COMBOS PARA QUE MANEJEN CONTADO Y CREDITO
      this.comboLista = combos.map((combo: any) => {

        const vendeContado =
          combo.vendeContado ??
          (combo.tipo === 'contado' || combo.tipo === 'ambos');

        const vendeCredito =
          combo.vendeCredito ??
          (combo.tipo === 'credito' || combo.tipo === 'ambos');

        const precioContado =
          combo.precioContado ??
          (combo.tipo !== 'credito' ? combo.precio : null);

        const precioCredito =
          combo.precioCredito ??
          (combo.tipo !== 'contado' ? combo.precio : null);

        return {
          ...combo,
          vendeContado,
          vendeCredito,
          precioContado,
          precioCredito,
          imagenActiva: combo.imagen
        };

      });

      this.productosLista = productos;

      this.cdr.detectChanges();

      this.restaurarProducto();

    } catch (error) {

      console.error('Error cargando combos:', error);

    }

  }

  obtenerProducto(docId: string) {

    return this.productosLista.find(
      producto => producto.docId === docId
    );

  }

  verDetalleCombo(docId: string) {
    this.combos.productoParaVolver = docId;
    this.router.navigate(['/combo-detalle', docId]);

  }

  // OBTENGO EL PRECIO SEGUN LA MODALIDAD DEL COMBO
  precioFinal(combo: any, modalidad: 'contado' | 'credito') {

    if (modalidad === 'contado') {
      return combo.precioContado ?? combo.precio;
    }

    return combo.precioCredito ?? combo.precio;

  }

  restaurarProducto() {
  const docId = this.combos.productoParaVolver;

  if (!docId) return;

  let intentos = 0;
  const maxIntentos = 20;

  const buscarCombo = () => {
    const combo = document.getElementById('producto-' + docId);

    if (combo) {
      combo.scrollIntoView({
        behavior: 'auto',
        block: 'center'
      });

      this.combos.productoParaVolver = null;
      return;
    }

    intentos++;

    if (intentos < maxIntentos) {
      setTimeout(buscarCombo, 150);
    }
  };

  setTimeout(buscarCombo, 100);
}

  // GENERO EL MENSAJE DE WHATSAPP CON LAS DOS MODALIDADES DISPONIBLES
  obtenerLinkWhatsApp(combo: any): string {

    let precios = '';

    if (combo.vendeContado) {
      precios += ` Contado: ${this.precioFinal(combo, 'contado')}`;
    }

    if (combo.vendeCredito) {
      precios += ` Crédito: ${this.precioFinal(combo, 'credito')}`;

      if (combo.inicial != null) {
        precios += `, inicial: ${combo.inicial}`;
      }

      if (combo.quincenal != null) {
        precios += `, cuota quincenal: ${combo.quincenal}`;
      }
    }

    const mensaje =
      `Hola! Estoy interesado en el combo ${combo.nombre}.${precios}`;

    return `https://wa.me/573137110232?text=${encodeURIComponent(mensaje)}`;

  }



}
