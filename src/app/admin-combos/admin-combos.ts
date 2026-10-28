
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Productos } from '../services/productos';
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

  // MODALIDADES DE VENTA
  vendeContado: boolean = true;
  vendeCredito: boolean = false;

  // FRECUENCIAS DE CRÉDITO
  vendeQuincenal: boolean = true;
  vendeMensual: boolean = false;

  // PRECIOS
  precioContado: number | null = 0;
  precioCredito: number | null = 0;

  inicial: number | null = 0;

  // CUOTAS QUINCENALES
  quincenal: number | null = 0;
  cuotasQuincenales: number | null = 1;

  // CUOTAS MENSUALES
  mensual: number | null = 0;
  cuotasMensuales: number | null = 1;

  // PRECIO ANTIGUO PARA COMPATIBILIDAD
  precioCombo: number = 0;

  descripcionCombo: string = '';

  // ID DEL DOCUMENTO QUE SE ESTÁ EDITANDO
  docIdEditando: string = '';

  get comboEditando(): boolean {
    return !!this.docIdEditando;
  }

  constructor(
    private productos: Productos,
    private combos: Combos
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // CARGAR PRODUCTOS
      this.productoss = await this.productos.obtenerProductos();

      // SEPARAR PRODUCTOS POR CATEGORÍA
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

      // CARGAR COMBOS
      await this.cargarCombos();

    } catch (error) {
      console.error('Error cargando productos o combos:', error);
    }
  }

  // GUARDAR O ACTUALIZAR COMBO
  async guardarCombo(): Promise<void> {
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
        (this.inicial == null || this.inicial < 0)
      ) {
        alert('Ingresa una cuota inicial válida');
        return;
      }

      if (
        this.vendeCredito &&
        !this.vendeQuincenal &&
        !this.vendeMensual
      ) {
        alert('Selecciona al menos una frecuencia: quincenal o mensual');
        return;
      }

      if (
        this.vendeCredito &&
        this.vendeQuincenal &&
        (
          this.quincenal == null ||
          this.quincenal <= 0 ||
          this.cuotasQuincenales == null ||
          !Number.isInteger(Number(this.cuotasQuincenales)) ||
          this.cuotasQuincenales <= 0
        )
      ) {
        alert('Ingresa un valor quincenal y una cantidad de cuotas quincenales válidos');
        return;
      }

      if (
        this.vendeCredito &&
        this.vendeMensual &&
        (
          this.mensual == null ||
          this.mensual <= 0 ||
          this.cuotasMensuales == null ||
          !Number.isInteger(Number(this.cuotasMensuales)) ||
          this.cuotasMensuales <= 0
        )
      ) {
        alert('Ingresa un valor mensual y una cantidad de cuotas mensuales válidos');
        return;
      }

      // CONSERVAR COMPATIBILIDAD CON COMBOS ANTIGUOS
      this.precioCombo = this.vendeContado
        ? this.precioContado!
        : this.precioCredito!;

      // SI UNA FRECUENCIA NO SE OFRECE, NO GUARDAR SUS VALORES
      const valorQuincenal = this.vendeCredito && this.vendeQuincenal
        ? this.quincenal
        : null;

      const cantidadQuincenal = this.vendeCredito && this.vendeQuincenal
        ? Number(this.cuotasQuincenales)
        : null;

      const valorMensual = this.vendeCredito && this.vendeMensual
        ? this.mensual
        : null;

      const cantidadMensual = this.vendeCredito && this.vendeMensual
        ? Number(this.cuotasMensuales)
        : null;

      if (this.docIdEditando) {
        // ACTUALIZAR COMBO EXISTENTE
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
          valorQuincenal,
          cantidadQuincenal,
          valorMensual,
          cantidadMensual,
          this.vendeQuincenal,
          this.vendeMensual
        );

        alert('Combo actualizado');

      } else {
        // CREAR COMBO NUEVO
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
          valorQuincenal,
          cantidadQuincenal,
          valorMensual,
          cantidadMensual,
          this.vendeQuincenal,
          this.vendeMensual
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

  // CARGAR COMBOS Y ADAPTAR LOS ANTIGUOS
  async cargarCombos(): Promise<void> {
    const combos = await this.combos.obtenerCombo();

    this.combolista = combos.map((combo: any) => {
      const vendeContado =
        combo.vendeContado ??
        (
          combo.tipo === 'contado' ||
          combo.tipo === 'ambos' ||
          combo.tipo == null
        );

      const vendeCredito =
        combo.vendeCredito ??
        (
          combo.tipo === 'credito' ||
          combo.tipo === 'ambos'
        );

      // LOS COMBOS ANTIGUOS TENÍAN CUOTA QUINCENAL
      const vendeQuincenal =
        combo.vendeQuincenal ??
        (combo.quincenal != null && Number(combo.quincenal) > 0);

      const vendeMensual =
        combo.vendeMensual ??
        (combo.mensual != null && Number(combo.mensual) > 0);

      return {
        ...combo,
        vendeContado,
        vendeCredito,
        vendeQuincenal,
        vendeMensual,

        precioContado:
          combo.precioContado ??
          (combo.tipo !== 'credito' ? combo.precio : null),

        precioCredito:
          combo.precioCredito ??
          (combo.tipo !== 'contado' ? combo.precio : null)
      };
    });
  }

  // CARGAR DATOS PARA EDITAR
  editar(combo: any): void {
    this.docIdEditando = combo.docId;

    this.idCombo = combo.id ?? 0;
    this.nombreCombo = combo.nombre ?? '';
    this.imagenCombo = combo.imagen ?? '/assets/img/';

    this.baseId = combo.baseId ?? '';
    this.colchonId = combo.colchonId ?? '';
    this.espaldarId = combo.espaldarId ?? '';

    this.vendeContado =
      combo.vendeContado ??
      (combo.tipo === 'credito' ? false : true);

    this.vendeCredito =
      combo.vendeCredito ??
      (
        combo.tipo === 'credito' ||
        combo.tipo === 'ambos'
      );

    this.precioContado =
      combo.precioContado ??
      (combo.tipo !== 'credito' ? combo.precio ?? 0 : 0);

    this.precioCredito =
      combo.precioCredito ??
      (combo.tipo !== 'contado' ? combo.precio ?? 0 : 0);

    this.inicial = combo.inicial ?? 0;

    this.vendeQuincenal =
      combo.vendeQuincenal ??
      (combo.quincenal != null && Number(combo.quincenal) > 0);

    this.vendeMensual =
      combo.vendeMensual ??
      (combo.mensual != null && Number(combo.mensual) > 0);

    this.quincenal = combo.quincenal ?? 0;
    this.cuotasQuincenales = combo.cuotasQuincenales ?? 1;

    this.mensual = combo.mensual ?? 0;
    this.cuotasMensuales = combo.cuotasMensuales ?? 1;

    this.precioCombo = combo.precio ?? 0;
    this.descripcionCombo = combo.descripcion ?? '';
  }

  // LIMPIAR FORMULARIO Y SALIR DE EDICIÓN
  limpiarFormulario(): void {
    this.docIdEditando = '';

    this.idCombo = 0;
    this.nombreCombo = '';
    this.imagenCombo = '/assets/img/';

    this.baseId = '';
    this.colchonId = '';
    this.espaldarId = '';

    this.vendeContado = true;
    this.vendeCredito = false;

    this.vendeQuincenal = true;
    this.vendeMensual = false;

    this.precioContado = 0;
    this.precioCredito = 0;

    this.inicial = 0;

    this.quincenal = 0;
    this.cuotasQuincenales = 1;

    this.mensual = 0;
    this.cuotasMensuales = 1;

    this.precioCombo = 0;
    this.descripcionCombo = '';
  }

  // ELIMINAR COMBO
  async eliminar(docId: string): Promise<void> {
    const confirmar = confirm('¿Deseas eliminar este combo?');

    if (!confirmar) {
      return;
    }

    try {
      await this.combos.eliminarCombo(docId);
      await this.cargarCombos();

      // SI SE ELIMINA EL COMBO QUE SE EDITABA, LIMPIAR
      if (this.docIdEditando === docId) {
        this.limpiarFormulario();
      }

    } catch (error) {
      console.error('Error eliminando combo:', error);
      alert('No se pudo eliminar el combo');
    }
  }
}

