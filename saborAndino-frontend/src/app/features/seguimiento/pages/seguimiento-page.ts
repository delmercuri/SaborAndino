import { Component } from '@angular/core';

import {
  SeguimientoHero
} from '../components/seguimiento-hero/seguimiento-hero';

import {
  SeguimientoProcess
} from '../components/seguimiento-process/seguimiento-process';

@Component({
  selector: 'app-seguimiento-page',
  standalone: true,
  imports: [
    SeguimientoHero,
    SeguimientoProcess
  ],
  templateUrl: './seguimiento-page.html',
  styleUrl: './seguimiento-page.css'
})
export class SeguimientoPage {}