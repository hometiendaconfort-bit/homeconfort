import { Component, OnInit } from '@angular/core';
import { CarrucelService } from '../../services/carrucel.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-carrucel',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './admin-carrucel.html',
  styleUrl: './admin-carrucel.css',
})
export class AdminCarrucel implements OnInit {

  carrucel: any[] = [];

  docIdEditando = '';

  id = 0;
  imagen = '/assets/img/';

  constructor(private carrucelService: CarrucelService) {}

  async ngOnInit() {
    await this.cargarCarrucel();
  }

  // =========================
  // CARGAR
  // =========================

  async cargarCarrucel() {

    this.carrucel = await this.carrucelService.obtenerCarrucel();

  }


  // =========================
  // GUARDAR / EDITAR
  // =========================

  async guardarCarrucel() {

    try {

      if (this.docIdEditando) {

        await this.carrucelService.editarCarrucel(
          this.docIdEditando,
          this.id,
          this.imagen
        );

        alert('Imagen editada correctamente');

      } else {

        await this.carrucelService.agregarCarrucel(
          this.id,
          this.imagen
        );

        alert('Imagen guardada correctamente');

      }

      await this.cargarCarrucel();

      this.limpiarFormulario();

    } catch (error) {

      console.error(error);

      alert('Error al guardar la imagen');

    }

  }


  // =========================
  // ELIMINAR
  // =========================

  async eliminar(docId: string) {

    const confirmar = confirm(
      '¿Deseas eliminar esta imagen?'
    );

    if (!confirmar) {
      return;
    }

    try {

      await this.carrucelService.eliminarCarrucel(docId);

      await this.cargarCarrucel();

      alert('Imagen eliminada correctamente');

    } catch (error) {

      console.error(error);

      alert('Error al eliminar la imagen');

    }

  }


  // =========================
  // EDITAR
  // =========================

  editar(carrucel: any) {

    this.docIdEditando = carrucel.docId;

    this.id = carrucel.id;

    this.imagen = carrucel.imagen;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

  }


  // =========================
  // LIMPIAR
  // =========================

  limpiarFormulario() {

    this.docIdEditando = '';

    this.id = 0;

    this.imagen = '';

  }

}
