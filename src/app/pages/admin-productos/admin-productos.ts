import { Component, OnInit } from '@angular/core';
import { Productos } from '../../services/productos';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-productos',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './admin-productos.html',
  styleUrl: './admin-productos.css',
})
export class AdminProductos implements OnInit {
 productoss: any[] = [];
  docIdEditando = '';

  id = 0;
  nombre = '';

  precioContado = 0;
  precioCredito = 0;

  vendeContado = true;
  vendeCredito = false;

  inicial = 0;
  quincenal = 0;

  categoria = '';
  descripcion = '';
  color = '';
  descuento = 0;

  imagen = '/assets/img/';
  imagenesTexto = '';

  constructor(private productos: Productos) {}

  async ngOnInit() {
    await this.cargarProductos();
  }

  async guardarProducto() {

    try {

      if (!this.vendeContado && !this.vendeCredito) {
        alert('Selecciona al menos una modalidad de venta');
        return;
      }

      if (this.vendeContado && this.precioContado <= 0) {
        alert('Ingresa un precio de contado válido');
        return;
      }

      if (this.vendeCredito && this.precioCredito <= 0) {
        alert('Ingresa un precio a crédito válido');
        return;
      }

      const imagenes = this.imagenesTexto
        .split(',')
        .map(img => img.trim())
        .filter(img => img !== '');

      const tipo = this.vendeContado && this.vendeCredito
        ? 'ambos'
        : this.vendeContado
          ? 'contado'
          : 'credito';

      // Mantengo precio para compatibilidad con productos anteriores.
      const precio = this.vendeContado
        ? this.precioContado
        : this.precioCredito;

      const producto = {
        id: this.id,
        nombre: this.nombre,
        precio,
        precioContado: this.vendeContado ? this.precioContado : null,
        precioCredito: this.vendeCredito ? this.precioCredito : null,
        vendeContado: this.vendeContado,
        vendeCredito: this.vendeCredito,
        inicial: this.vendeCredito ? this.inicial : 0,
        quincenal: this.vendeCredito ? this.quincenal : 0,
        categoria: this.categoria,
        descripcion: this.descripcion,
        color: this.color,
        tipo,
        descuento: this.descuento,
        imagen: this.imagen,
        imagenes
      };

      if (this.docIdEditando) {

        await this.productos.editarProducto(
          this.docIdEditando,
          producto
        );

        alert('Producto actualizado correctamente');

      } else {

        await this.productos.agregarProducto(producto);

        alert('Producto guardado correctamente');
      }

      await this.cargarProductos();
      this.limpiarFormulario();

    } catch (error) {

      console.error(error);
      alert('Error al guardar el producto');
    }
  }

  async cargarProductos() {

    this.productoss = await this.productos.obtenerProductos();
  }

  async eliminar(docId: string) {

    const confirmar = confirm('¿Deseas eliminar este producto?');

    if (!confirmar) {
      return;
    }

    await this.productos.eliminarProducto(docId);
    await this.cargarProductos();
  }

  editar(producto: any) {

    this.docIdEditando = producto.docId;

    this.id = producto.id;
    this.nombre = producto.nombre;

    // Detectar productos antiguos que solo tienen precio y tipo.
    this.vendeContado = producto.vendeContado ??
      (producto.tipo === 'contado' || producto.tipo === 'ambos');

    this.vendeCredito = producto.vendeCredito ??
      (producto.tipo === 'credito' || producto.tipo === 'ambos');

    this.precioContado = producto.precioContado ??
      (producto.tipo !== 'credito' ? producto.precio : 0);

    this.precioCredito = producto.precioCredito ??
      (producto.tipo !== 'contado' ? producto.precio : 0);

    this.inicial = producto.inicial ?? 0;
    this.quincenal = producto.quincenal ?? 0;

    this.categoria = producto.categoria ?? '';
    this.descripcion = producto.descripcion ?? '';
    this.color = producto.color ?? '';
    this.descuento = producto.descuento ?? 0;

    this.imagen = producto.imagen ?? '/assets/img/';

    this.imagenesTexto = Array.isArray(producto.imagenes)
      ? producto.imagenes.join(', ')
      : '';

    document.getElementById('admin-productos')?.scrollIntoView({
      behavior: 'smooth'
    });
  }

  limpiarFormulario() {

    this.docIdEditando = '';

    this.id = 0;
    this.nombre = '';

    this.precioContado = 0;
    this.precioCredito = 0;

    this.vendeContado = true;
    this.vendeCredito = false;

    this.inicial = 0;
    this.quincenal = 0;

    this.categoria = '';
    this.descripcion = '';
    this.color = '';
    this.descuento = 0;

    this.imagen = '/assets/img/';
    this.imagenesTexto = '';
  }
}