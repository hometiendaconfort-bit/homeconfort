import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Carrucel } from "../../components/carrucel/carrucel";
import { Productoss } from '../productoss/productoss';

import { CombosComponent } from "../../combos/combos";
import { QuienesSomos } from "../../quienes-somos/quienes-somos";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, Carrucel, Productoss, CombosComponent, QuienesSomos],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})

export class Home {}



