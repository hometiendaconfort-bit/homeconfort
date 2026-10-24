import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
selector: 'app-requisitos',
standalone: true,
imports: [CommonModule, RouterModule],
templateUrl: './requisitos.html',
styleUrl: './requisitos.css',
})

export class Requisitos  {

requisitos = [
    {
      icono: 'bx bx-user-plus',
      descripcion: ' Foto de la Cedula por Ambos Lados ',
      
    },
    {
      icono: 'bx bx-home',
      descripcion: 'trabajo Estable',
      
    },

    {
      icono: 'bx bx-home',
      descripcion: 'aplica para resportados y extrangeros',
    
    }
   
  ];
}


