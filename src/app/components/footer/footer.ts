import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';


@Component({
selector: 'app-footer',
standalone: true,
imports: [CommonModule, RouterModule],
templateUrl: './footer.html',
styleUrl: './footer.css',
})

export class Footer {

    footers = [
        {
           descripcion: 'somos distribuidores de camas, colchones, cabeceros, almohadas, salas y mas.',
           descripcion2: ' Contamos con productos de alta calidad y durabilidad, ofreciendo a nuestros clientes la mejor experiencia de compra.',
           email: 'conforthoome@gmail.com',
           telefono: '+57 3137110232' + '  +57 3226948167',
           texto: '© 2026 MiSitio confort home. Todos los derechos reservados.'
        }
    ];
}