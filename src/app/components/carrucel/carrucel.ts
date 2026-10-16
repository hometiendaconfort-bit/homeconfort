import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CarrucelService } from '../../services/carrucel.service';

@Component({
  selector: 'app-carrucel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './carrucel.html',
  styleUrls: ['./carrucel.css']
})
export class Carrucel implements OnInit {

  imagenes: any[] = [];
  posicionActual = 0;

  links = [
    { nombre: 'Colchones',  img: '/assets/img/colchonInicio.jpg',   ruta: '/categoria/colchon' },
    { nombre: 'Espaldares', img: '/assets/img/espaldarInicio.jpg',  ruta: '/categoria/espaldar' },
    { nombre: 'Base cama',  img: '/assets/img/basecamaInicio.jpg',  ruta: '/categoria/basecama' },
    { nombre: 'Armarios',   img: '/assets/img/armarioInicio.jpg',   ruta: '/categoria/armario' },
    { nombre: 'Comedores',  img: '/assets/img/comedoresInicio.jpg', ruta: '/categoria/comedor' },
    { nombre: 'Peinadores', img: '/assets/img/peinadorInicio.jpg',  ruta: '/categoria/peinador' },
    { nombre: 'Salas',      img: '/assets/img/salasInicio.jpg',     ruta: '/categoria/sala' },
    { nombre: 'Cama lujo',  img: '/assets/img/camalujoInicio1.jpg', ruta: '/categoria/lujo' },
    { nombre: 'accesorio',  img: '/assets/img/accesorio.png', ruta: '/categoria/accesorios' }
  ];

  constructor(
    private carrucelService: CarrucelService,
    private cd: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {

    console.time('Carrucel');

    try {

      const data = await this.carrucelService.getCarrusel();

      console.timeEnd('Carrucel');
      console.log(data);

      this.imagenes = data;
      this.posicionActual = 0;
      this.cd.detectChanges();

    } catch (error) {

      console.error('Error cargando carrucel:', error);

    }

  }

  siguiente() {

    if (this.imagenes.length === 0) {
      return;
    }

    this.posicionActual =
      (this.posicionActual + 1) %
      this.imagenes.length;

  }

  anterior() {

    if (this.imagenes.length === 0) {
      return;
    }

    this.posicionActual =
      (this.posicionActual - 1 +
        this.imagenes.length) %
      this.imagenes.length;

  }

}
