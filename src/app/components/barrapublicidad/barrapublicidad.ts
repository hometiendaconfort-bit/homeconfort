import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-barrapublicidad',
  standalone: true,   
  imports: [CommonModule, RouterModule], 
  templateUrl: './barrapublicidad.html',
  styleUrls: ['./barrapublicidad.css']
})

export class Barrapublicidad{

promos = [
    {
      titulo: '¿ Necesitas Financiamiento? ',
      descripcion: 'pide ya tu credito',
      ruta: '/requisitos',
      texto: ''
    }
  ]

}

