import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Productos } from '../services/productos';
import { FormsModule } from '@angular/forms';
import { Combos } from '../services/combos';
@Component({
  selector: 'app-admin-combos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-combos.html',
  styleUrl: './admin-combos.css',
})
export class AdminCombos implements OnInit {

combolista: any[] = [];

productoss: any[] = [];
bases: any[] = [];
colchones: any[] = [];
espaldares: any[] = [];

idCombo: number = 0;
nombreCombo: string = '';
imagenCombo: string = '/assets/img/';
baseId: string = '';
colchonId: string = '';
espaldarId: string = '';
precioCombo: number = 0;
descripcionCombo: string = '';

docIdEditando = '';

  constructor(
    private productos: Productos,
    private combos: Combos,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {

    try {

      this.productoss = await this.productos.obtenerProductos();

      this.bases = this.productoss.filter(
  producto => producto.categoria === 'basecama'
);

this.colchones = this.productoss.filter(
  producto => producto.categoria === 'colchon'
);

this.espaldares = this.productoss.filter(
  producto => producto.categoria === 'espaldar'
);

      console.log('Productos para combos:', this.productoss);
 await this.cargarCombos();
      this.cdr.detectChanges();

    } catch (error) {

      console.error('Error cargando productos:', error);

    }

  }

async guardarCombo() {

  try {

    if (this.docIdEditando) {

      await this.combos.editarCombo(
        this.docIdEditando,
        this.idCombo,
        this.nombreCombo,
        this.imagenCombo,
        this.baseId,
        this.colchonId,
        this.espaldarId,
        this.precioCombo,
        this.descripcionCombo
      );

      alert('Combo actualizado');

    } else {

      await this.combos.agregarCombo(
        this.idCombo,
        this.nombreCombo,
        this.imagenCombo,
        this.baseId,
        this.colchonId,
        this.espaldarId,
        this.precioCombo,
        this.descripcionCombo
      );

      alert('Combo guardado');

    }

    await this.cargarCombos();

    this.limpiarFormulario();

  } catch (error) {

    console.error('Error guardando combo:', error);

  }

}

async cargarCombos() {

  this.combolista = await this.combos.obtenerCombo();

}

editar(combo: any) {

  this.docIdEditando = combo.docId;

  this.idCombo = combo.id;
  this.nombreCombo = combo.nombre;
  this.imagenCombo = combo.imagen;

  this.baseId = combo.baseId;
  this.colchonId = combo.colchonId;
  this.espaldarId = combo.espaldarId;

  this.precioCombo = combo.precio;
  this.descripcionCombo = combo.descripcion;

}

limpiarFormulario() {

  this.docIdEditando = '';

  this.idCombo = 0;
  this.nombreCombo = '';
this.imagenCombo = '';
  this.baseId = '';
  this.colchonId = '';
  this.espaldarId = '';

  this.precioCombo = 0;
  this.descripcionCombo = '';

}

async eliminar(docId: string) {

  const confirmar = confirm(
    '¿Deseas eliminar este combo?'
  );

  if (!confirmar) {
    return;
  }

  await this.combos.eliminarCombo(docId);

  await this.cargarCombos();

}


}
