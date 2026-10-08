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
precio = 0;
inicial = 0;
quincenal = 0;
categoria = '';
descripcion = '';
color = '';
tipo = '';
descuento = 0;
imagen = '/assets/img/';
imagenes: string[] = ['/assets/img/'];


constructor(private productos: Productos) {}

async ngOnInit() {
  await this.cargarProductos();
}


async guardarProducto() {

  try {

    if (this.docIdEditando) {

      await this.productos.editarProducto(
        this.docIdEditando,
        this.id,
        this.nombre,
        this.precio,
        this.inicial,
        this.quincenal,
        this.categoria,
        this.descripcion,
        this.color,
        this.tipo,
        this.descuento,
        this.imagen,
        this.imagenes
      );

      alert('Producto actualizado correctamente');

    } else {

      await this.productos.agregarProducto(
        this.id,
        this.nombre,
        this.precio,
        this.inicial,
        this.quincenal,
        this.categoria,
        this.descripcion,
        this.color,
        this.tipo,
        this.descuento,
        this.imagen,
        this.imagenes
      );

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
  this.precio = producto.precio;
  this.inicial= producto.inicial;
  this.quincenal= producto.quincenal;
  this.categoria = producto.categoria;
  this.descripcion = producto.descripcion || '';
  this.color = producto.color;
  this.tipo = producto.tipo;
  this.descuento = producto.descuento;
  this.imagen = producto.imagen;
  this.imagenes = producto.imagenes || [];


   document.getElementById('admin-productos')?.scrollIntoView({
    behavior: 'smooth'
  });

}

limpiarFormulario() {

  this.docIdEditando = '';

  this.id = 0;
  this.nombre = '';
  this.precio = 0;
  this.inicial = 0;
  this.quincenal = 0;
  this.categoria = '';
  this.descripcion = '';
  this.color = '';
  this.tipo = '';
  this.descuento = 0;
  this.imagen = '/assets/img/';
  this.imagenes = [];

}

}

