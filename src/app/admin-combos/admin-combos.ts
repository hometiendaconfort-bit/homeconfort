
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Productos } from '../services/productos';
import { Combos } from '../services/combos';

interface VarianteColor {
  color: string;
  imagen: string;
  imagenes?: string[];
  imagenesTexto?: string;
}

@Component({
  selector: 'app-admin-combos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-combos.html',
  styleUrl: './admin-combos.css'
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

  baseColor: string = '';
  colchonColor: string = '';
  espaldarColor: string = '';

  // Almohadas opcionales.
  incluyeAlmohadas: boolean = false;
  cantidadAlmohadas: number = 0;

  vendeContado: boolean = true;
  vendeCredito: boolean = false;

  vendeQuincenal: boolean = true;
  vendeMensual: boolean = false;

  precioContado: number | null = 0;
  precioCredito: number | null = 0;
  inicial: number | null = 0;

  quincenal: number | null = 0;
  cuotasQuincenales: number | null = 1;

  mensual: number | null = 0;
  cuotasMensuales: number | null = 1;

  precioCombo: number = 0;
  descripcionCombo: string = '';

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

      await this.cargarCombos();

    } catch (error) {
      console.error('Error cargando productos o combos:', error);
    }
  }

  // Devuelve los colores disponibles de un producto.
  // También admite productos antiguos que solo tengan "color".
  obtenerVariantes(productoId: string): VarianteColor[] {
    if (!productoId) {
      return [];
    }

    const producto = this.productoss.find(
      item => item.docId === productoId
    );

    if (!producto) {
      return [];
    }

    if (
      Array.isArray(producto.variantesColor) &&
      producto.variantesColor.length > 0
    ) {
      return producto.variantesColor;
    }

    if (producto.color) {
      return [{
        color: producto.color,
        imagen: producto.imagen || '',
        imagenes: Array.isArray(producto.imagenes)
          ? producto.imagenes
          : [],
        imagenesTexto: producto.imagenesTexto || ''
      }];
    }

    return [];
  }

  obtenerVarianteSeleccionada(
    productoId: string,
    color: string
  ): VarianteColor | null {
    return this.obtenerVariantes(productoId)
      .find(variante => variante.color === color) ?? null;
  }

  obtenerProductoSeleccionado(productoId: string): any {
    return this.productoss.find(
      producto => producto.docId === productoId
    ) ?? null;
  }

  // Selecciona el primer color cuando cambia el producto.
  cambioProducto(tipo: 'base' | 'colchon' | 'espaldar'): void {
    if (tipo === 'base') {
      const variantes = this.obtenerVariantes(this.baseId);
      this.baseColor = variantes.length > 0
        ? variantes[0].color
        : '';
    }

    if (tipo === 'colchon') {
      const variantes = this.obtenerVariantes(this.colchonId);
      this.colchonColor = variantes.length > 0
        ? variantes[0].color
        : '';
    }

    if (tipo === 'espaldar') {
      const variantes = this.obtenerVariantes(this.espaldarId);
      this.espaldarColor = variantes.length > 0
        ? variantes[0].color
        : '';
    }
  }

  async guardarCombo(): Promise<void> {
    try {
      if (!this.nombreCombo.trim()) {
        alert('Escribe el nombre del combo');
        return;
      }

      if (!this.baseId || !this.colchonId) {
        alert('Selecciona la base y el colchón del combo');
        return;
      }

      // Validar la cantidad de almohadas.
      if (
        this.incluyeAlmohadas &&
        (
          !Number.isInteger(Number(this.cantidadAlmohadas)) ||
          Number(this.cantidadAlmohadas) < 1
        )
      ) {
        alert('Ingresa una cantidad válida de almohadas');
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
        alert(
          'Ingresa un valor y una cantidad de cuotas quincenales válidos'
        );
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
        alert(
          'Ingresa un valor y una cantidad de cuotas mensuales válidos'
        );
        return;
      }

      this.precioCombo = this.vendeContado
        ? this.precioContado!
        : this.precioCredito!;

      const valorQuincenal =
        this.vendeCredito && this.vendeQuincenal
          ? this.quincenal
          : null;

      const cantidadQuincenal =
        this.vendeCredito && this.vendeQuincenal
          ? Number(this.cuotasQuincenales)
          : null;

      const valorMensual =
        this.vendeCredito && this.vendeMensual
          ? this.mensual
          : null;

      const cantidadMensual =
        this.vendeCredito && this.vendeMensual
          ? Number(this.cuotasMensuales)
          : null;

      const colores = {
        baseColor: this.baseColor || '',
        colchonColor: this.colchonColor || '',
        espaldarColor: this.espaldarId
          ? this.espaldarColor || ''
          : ''
      };

      // Normalizar los datos de las almohadas.
      const incluyeAlmohadas = this.incluyeAlmohadas;
      const cantidadAlmohadas = incluyeAlmohadas
        ? Number(this.cantidadAlmohadas)
        : 0;

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
          valorQuincenal,
          cantidadQuincenal,
          valorMensual,
          cantidadMensual,
          this.vendeQuincenal,
          this.vendeMensual,
          colores,
          incluyeAlmohadas,
          cantidadAlmohadas
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
          valorQuincenal,
          cantidadQuincenal,
          valorMensual,
          cantidadMensual,
          this.vendeQuincenal,
          this.vendeMensual,
          colores,
          incluyeAlmohadas,
          cantidadAlmohadas
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

  async cargarCombos(): Promise<void> {
    const combos = await this.combos.obtenerCombo();

    this.combolista = combos.map((combo: any) => {
      const vendeContado = combo.vendeContado ??
        (
          combo.tipo === 'contado' ||
          combo.tipo === 'ambos' ||
          combo.tipo == null
        );

      const vendeCredito = combo.vendeCredito ??
        (
          combo.tipo === 'credito' ||
          combo.tipo === 'ambos'
        );

      const vendeQuincenal = combo.vendeQuincenal ??
        (combo.quincenal != null && Number(combo.quincenal) > 0);

      const vendeMensual = combo.vendeMensual ??
        (combo.mensual != null && Number(combo.mensual) > 0);

      return {
        ...combo,
        incluyeAlmohadas: combo.incluyeAlmohadas ?? false,
        cantidadAlmohadas: combo.cantidadAlmohadas ?? 0,
        vendeContado,
        vendeCredito,
        vendeQuincenal,
        vendeMensual,
        precioContado: combo.precioContado ??
          (combo.tipo !== 'credito' ? combo.precio : null),
        precioCredito: combo.precioCredito ??
          (combo.tipo !== 'contado' ? combo.precio : null)
      };
    });
  }

  editar(combo: any): void {
    this.docIdEditando = combo.docId;
    this.idCombo = combo.id ?? 0;
    this.nombreCombo = combo.nombre ?? '';
    this.imagenCombo = combo.imagen ?? '/assets/img/';

    this.baseId = combo.baseId ?? '';
    this.colchonId = combo.colchonId ?? '';
    this.espaldarId = combo.espaldarId ?? '';

    this.baseColor = combo.baseColor ?? '';
    this.colchonColor = combo.colchonColor ?? '';
    this.espaldarColor = combo.espaldarColor ?? '';

    if (!this.baseColor) {
      this.cambioProducto('base');
    }

    if (!this.colchonColor) {
      this.cambioProducto('colchon');
    }

    if (!this.espaldarColor) {
      this.cambioProducto('espaldar');
    }

    // Recuperar las almohadas guardadas.
    this.incluyeAlmohadas = combo.incluyeAlmohadas ?? false;
    this.cantidadAlmohadas = combo.cantidadAlmohadas ?? 0;

    this.vendeContado = combo.vendeContado ??
      (combo.tipo === 'credito' ? false : true);

    this.vendeCredito = combo.vendeCredito ??
      (combo.tipo === 'credito' || combo.tipo === 'ambos');

    this.precioContado = combo.precioContado ??
      (combo.tipo !== 'credito' ? combo.precio ?? 0 : 0);

    this.precioCredito = combo.precioCredito ??
      (combo.tipo !== 'contado' ? combo.precio ?? 0 : 0);

    this.inicial = combo.inicial ?? 0;

    this.vendeQuincenal = combo.vendeQuincenal ??
      (combo.quincenal != null && Number(combo.quincenal) > 0);

    this.vendeMensual = combo.vendeMensual ??
      (combo.mensual != null && Number(combo.mensual) > 0);

    this.quincenal = combo.quincenal ?? 0;
    this.cuotasQuincenales = combo.cuotasQuincenales ?? 1;

    this.mensual = combo.mensual ?? 0;
    this.cuotasMensuales = combo.cuotasMensuales ?? 1;

    this.precioCombo = combo.precio ?? 0;
    this.descripcionCombo = combo.descripcion ?? '';
  }

  limpiarFormulario(): void {
    this.docIdEditando = '';

    this.idCombo = 0;
    this.nombreCombo = '';
    this.imagenCombo = '/assets/img/';

    this.baseId = '';
    this.colchonId = '';
    this.espaldarId = '';

    this.baseColor = '';
    this.colchonColor = '';
    this.espaldarColor = '';

    // Restablecer las almohadas.
    this.incluyeAlmohadas = false;
    this.cantidadAlmohadas = 0;

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

  async eliminar(docId: string): Promise<void> {
    const confirmar = confirm('¿Deseas eliminar este combo?');

    if (!confirmar) {
      return;
    }

    try {
      await this.combos.eliminarCombo(docId);
      await this.cargarCombos();

      if (this.docIdEditando === docId) {
        this.limpiarFormulario();
      }

    } catch (error) {
      console.error('Error eliminando combo:', error);
      alert('No se pudo eliminar el combo');
    }
  }
}
