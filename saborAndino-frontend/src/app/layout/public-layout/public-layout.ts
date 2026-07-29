import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Navbar } from '../../shared/components/navbar/navbar';
import { Footer } from '../../shared/components/footer/footer';
import { FloatingActions } from '../../shared/components/floating-actions/floating-actions';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    Navbar,
    Footer,
    FloatingActions
  ],
  templateUrl: './public-layout.html',
  styleUrl: './public-layout.css'
})
export class PublicLayout {}