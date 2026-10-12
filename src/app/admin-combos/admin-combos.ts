import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

  // PRECIOS Y MODALIDADES DEL COMBO
  vendeContado: boolean = true;
  vendeCredito: boolean = false;

  precioContado: number | null = 0;
  precioCredito: number | null = 0;

  inicial: number | null = 0;
  quincenal: number | null = 0;

  // MANTENGO EL PRECIO ANTIGUO PARA COMPATIBILIDAD
  precioCombo: number = 0;

  descripcionCombo: string = '';
  docIdEditando: string = '';

  get comboEditando(): boolean {
    return !!this.docIdEditando;
  }

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

      if (!this.nombreCombo.trim()) {
        alert('Escribe el nombre del combo');
        return;
      }

      if (!this.vendeContado && !this.vendeCredito) {
        alert('Selecciona al menos una modalidad de venta');
        return;
      }

      if (
        this.vendeContado &&
        (this.precioContado == null || this.precioContado <= 0)
      ) {
        alert('Ingresa un precio válido de contado');
        return;
      }

      if (
        this.vendeCredito &&
        (this.precioCredito == null || this.precioCredito <= 0)
      ) {
        alert('Ingresa un precio válido de crédito');
        return;
      }

      if (
        this.vendeCredito &&
        (this.inicial == null || this.quincenal == null)
      ) {
        alert('Ingresa la inicial y la cuota quincenal');
        return;
      }

      // CONSERVO EL PRECIO ANTIGUO PARA LOS COMBOS EXISTENTES
      this.precioCombo = this.vendeContado
        ? this.precioContado!
        : this.precioCredito!;

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
          this.descripcionCombo,
          this.vendeContado,
          this.vendeCredito,
          this.precioContado,
          this.precioCredito,
          this.inicial,
          this.quincenal
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
          this.descripcionCombo,
          this.vendeContado,
          this.vendeCredito,
          this.precioContado,
          this.precioCredito,
          this.inicial,
          this.quincenal
        );

        alert('Combo guardado');

      }

      await this.cargarCombos();

      this.limpiarFormulario();

    } catch (error) {

      console.error('Error guardando combo:', error);
      alert('No se pudo guardar el combo. Revisa la consola.');

    }

  }

  async cargarCombos() {

    const combos = await this.combos.obtenerCombo();

    // ADAPTO LOS COMBOS ANTIGUOS Y LOS NUEVOS
    this.combolista = combos.map((combo: any) => {

      const vendeContado =
        combo.vendeContado ??
        (combo.tipo === 'contado' ||
         combo.tipo === 'ambos' ||
         combo.tipo == null);

      const vendeCredito =
        combo.vendeCredito ??
        (combo.tipo === 'credito' ||
         combo.tipo === 'ambos');

      return {
        ...combo,
        vendeContado,
        vendeCredito,
        precioContado:
          combo.precioContado ??
          (combo.tipo !== 'credito' ? combo.precio : null),
        precioCredito:
          combo.precioCredito ??
          (combo.tipo !== 'contado' ? combo.precio : null)
      };

    });

    this.cdr.detectChanges();

  }

  editar(combo: any) {

    this.docIdEditando = combo.docId;

    this.idCombo = combo.id;
    this.nombreCombo = combo.nombre;
    this.imagenCombo = combo.imagen;

    this.baseId = combo.baseId ?? '';
    this.colchonId = combo.colchonId ?? '';
    this.espaldarId = combo.espaldarId ?? '';

    this.vendeContado = combo.vendeContado ??
      (combo.tipo === 'credito' ? false : true);

    this.vendeCredito = combo.vendeCredito ??
      (combo.tipo === 'credito' || combo.tipo === 'ambos');

    this.precioContado = combo.precioContado ??
      (combo.tipo !== 'credito' ? combo.precio : null);

    this.precioCredito = combo.precioCredito ??
      (combo.tipo !== 'contado' ? combo.precio : null);

    this.inicial = combo.inicial ?? 0;
    this.quincenal = combo.quincenal ?? 0;

    this.precioCombo = combo.precio ?? 0;
    this.descripcionCombo = combo.descripcion ?? '';

  }

  limpiarFormulario() {

    this.docIdEditando = '';

    this.idCombo = 0;
    this.nombreCombo = '';
    this.imagenCombo = '/assets/img/';

    this.baseId = '';
    this.colchonId = '';
    this.espaldarId = '';

    this.vendeContado = true;
    this.vendeCredito = false;

    this.precioContado = 0;
    this.precioCredito = 0;

    this.inicial = 0;
    this.quincenal = 0;

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

    try {

      await this.combos.eliminarCombo(docId);

      await this.cargarCombos();

    } catch (error) {

      console.error('Error eliminando combo:', error);
      alert('No se pudo eliminar el combo');

    }

  }

}