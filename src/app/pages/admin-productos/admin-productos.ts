
import { Component, OnInit } from '@angular/core';
import { Productos } from '../../services/productos';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-productos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-productos.html',
  styleUrl: './admin-productos.css'
})
export class AdminProductos implements OnInit {

  productoss: any[] = [];

  docIdEditando: string | null = null;

  id: string | number = '';
  nombre = '';

  vendeContado = true;
  vendeCredito = false;

  precioContado: number | null = null;
  precioCredito: number | null = null;

  inicial: number | null = 0;
  quincenal: number | null = 0;
  mensual: number | null = 0;

  numeroCuotasQuincenal: number | null = 0;
  numeroCuotasMensual: number | null = 0;

  categoria = '';
  descripcion = '';
  color = '';

  descuento: number | null = 0;

  imagen = '/assets/img/';
  imagenesTexto = '';

  guardando = false;
  mensajeError = '';

  constructor(private productosService: Productos) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  async cargarProductos(): Promise<void> {
    try {
      this.productoss = await this.productosService.obtenerProductos();
    } catch (error) {
      console.error('Error cargando productos:', error);
      this.mensajeError = 'No se pudieron cargar los productos.';
    }
  }

  async guardarProducto(): Promise<void> {
    this.mensajeError = '';

    const idTexto = String(this.id ?? '').trim();
    const nombreTexto = String(this.nombre ?? '').trim();

    if (!nombreTexto) {
      this.mensajeError = 'Escribe el nombre del producto.';
      return;
    }

    if (!this.vendeContado && !this.vendeCredito) {
      this.mensajeError = 'Selecciona contado, crédito o ambas modalidades.';
      return;
    }

    if (
      this.vendeContado &&
      (this.precioContado == null || Number(this.precioContado) <= 0)
    ) {
      this.mensajeError = 'Ingresa un precio de contado válido.';
      return;
    }

    if (
      this.vendeCredito &&
      (this.precioCredito == null || Number(this.precioCredito) <= 0)
    ) {
      this.mensajeError = 'Ingresa un precio a crédito válido.';
      return;
    }

    if (
      this.vendeCredito &&
      (this.inicial == null || Number(this.inicial) < 0)
    ) {
      this.mensajeError = 'La cuota inicial no puede ser negativa.';
      return;
    }

    if (this.vendeCredito && Number(this.quincenal) < 0) {
      this.mensajeError = 'La cuota quincenal no puede ser negativa.';
      return;
    }

    if (this.vendeCredito && Number(this.mensual) < 0) {
      this.mensajeError = 'La cuota mensual no puede ser negativa.';
      return;
    }

    if (
      this.vendeCredito &&
      Number(this.quincenal) > 0 &&
      (
        !Number.isInteger(Number(this.numeroCuotasQuincenal)) ||
        Number(this.numeroCuotasQuincenal) < 1
      )
    ) {
      this.mensajeError = 'Indica un número válido de cuotas quincenales.';
      return;
    }

    if (
      this.vendeCredito &&
      Number(this.mensual) > 0 &&
      (
        !Number.isInteger(Number(this.numeroCuotasMensual)) ||
        Number(this.numeroCuotasMensual) < 1
      )
    ) {
      this.mensajeError = 'Indica un número válido de cuotas mensuales.';
      return;
    }

    if (
      this.vendeCredito &&
      Number(this.quincenal) <= 0 &&
      Number(this.mensual) <= 0
    ) {
      this.mensajeError = 'Ingresa al menos una cuota quincenal o mensual.';
      return;
    }

    if (
      this.descuento != null &&
      (Number(this.descuento) < 0 || Number(this.descuento) > 100)
    ) {
      this.mensajeError = 'El descuento debe estar entre 0 y 100.';
      return;
    }

    const imagenes = String(this.imagenesTexto ?? '')
      .split(',')
      .map(url => url.trim())
      .filter(url => url.length > 0);

    const producto: any = {
      id: idTexto,
      nombre: nombreTexto,

      vendeContado: this.vendeContado,
      vendeCredito: this.vendeCredito,

      tipo:
        this.vendeContado && this.vendeCredito
          ? 'ambos'
          : this.vendeCredito
            ? 'credito'
            : 'contado',

      precioContado: this.vendeContado
        ? Number(this.precioContado)
        : 0,

      precioCredito: this.vendeCredito
        ? Number(this.precioCredito)
        : 0,

      precio: this.vendeContado
        ? Number(this.precioContado)
        : Number(this.precioCredito),

      inicial: this.vendeCredito ? Number(this.inicial ?? 0) : 0,
      quincenal: this.vendeCredito ? Number(this.quincenal ?? 0) : 0,
      mensual: this.vendeCredito ? Number(this.mensual ?? 0) : 0,

      numeroCuotasQuincenal: this.vendeCredito
        ? Number(this.numeroCuotasQuincenal ?? 0)
        : 0,

      numeroCuotasMensual: this.vendeCredito
        ? Number(this.numeroCuotasMensual ?? 0)
        : 0,

      numeroCuotas: this.vendeCredito
        ? Number(this.numeroCuotasQuincenal || this.numeroCuotasMensual || 0)
        : 0,

      categoria: String(this.categoria ?? '').trim(),
      descripcion: String(this.descripcion ?? '').trim(),
      color: String(this.color ?? '').trim(),

      descuento: Number(this.descuento ?? 0),

      imagen: String(this.imagen ?? '').trim(),
      imagenes
    };

    this.guardando = true;

    try {
      if (this.docIdEditando) {
        await this.productosService.editarProducto(
          this.docIdEditando,
          producto
        );
      } else {
        await this.productosService.agregarProducto(producto);
      }

      await this.cargarProductos();
      this.limpiarFormulario();

    } catch (error) {
      console.error('Error guardando producto:', error);

      this.mensajeError =
        'No se pudo guardar el producto. Revisa la conexión e inténtalo nuevamente.';

    } finally {
      this.guardando = false;
    }
  }

  editar(producto: any): void {
    this.docIdEditando = producto.docId;

    this.id = String(producto.id ?? '');
    this.nombre = String(producto.nombre ?? '');

    this.vendeContado =
      producto.vendeContado ??
      (
        producto.tipo === 'contado' ||
        producto.tipo === 'ambos' ||
        (!producto.tipo && producto.precio != null)
      );

    this.vendeCredito =
      producto.vendeCredito ??
      (
        producto.tipo === 'credito' ||
        producto.tipo === 'ambos'
      );

    this.precioContado =
      producto.precioContado ??
      (producto.tipo !== 'credito' ? producto.precio ?? null : null);

    this.precioCredito =
      producto.precioCredito ??
      (producto.tipo !== 'contado' ? producto.precio ?? null : null);

    this.inicial = Number(producto.inicial ?? 0);
    this.quincenal = Number(producto.quincenal ?? 0);
    this.mensual = Number(producto.mensual ?? 0);

    this.numeroCuotasQuincenal = Number(
      producto.numeroCuotasQuincenal ??
      (
        producto.frecuenciaPago !== 'mensual'
          ? producto.numeroCuotas ?? 0
          : 0
      )
    );

    this.numeroCuotasMensual = Number(
      producto.numeroCuotasMensual ??
      (
        producto.frecuenciaPago === 'mensual'
          ? producto.numeroCuotas ?? 0
          : 0
      )
    );

    this.categoria = String(producto.categoria ?? '');
    this.descripcion = String(producto.descripcion ?? '');
    this.color = String(producto.color ?? '');

    this.descuento = Number(producto.descuento ?? 0);

    this.imagen = String(producto.imagen ?? '');

    this.imagenesTexto = Array.isArray(producto.imagenes)
      ? producto.imagenes.join(', ')
      : '';

    this.mensajeError = '';

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  async eliminar(docId: string): Promise<void> {
    if (!docId) {
      this.mensajeError = 'No se encontró el identificador del producto.';
      return;
    }

    if (!confirm('¿Seguro que deseas eliminar este producto?')) {
      return;
    }

    try {
      await this.productosService.eliminarProducto(docId);

      await this.cargarProductos();

      if (this.docIdEditando === docId) {
        this.limpiarFormulario();
      }

    } catch (error) {
      console.error('Error eliminando producto:', error);
      this.mensajeError = 'No se pudo eliminar el producto.';
    }
  }

  limpiarFormulario(): void {
    this.docIdEditando = null;

    this.id = '';
    this.nombre = '';

    this.vendeContado = true;
    this.vendeCredito = false;

    this.precioContado = null;
    this.precioCredito = null;

    this.inicial = 0;
    this.quincenal = 0;
    this.mensual = 0;

    this.numeroCuotasQuincenal = 0;
    this.numeroCuotasMensual = 0;

    this.categoria = '';
    this.descripcion = '';
    this.color = '';

    this.descuento = 0;

    this.imagen = '';
    this.imagenesTexto = '';

    this.mensajeError = '';
  }
}
