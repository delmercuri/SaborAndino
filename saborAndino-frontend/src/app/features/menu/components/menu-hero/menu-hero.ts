import {
  Component,
  EventEmitter,
  Output
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

@Component({
  selector: 'app-menu-hero',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './menu-hero.html',
  styleUrl: './menu-hero.css'
})
export class MenuHero {

  /*
   * Comunica al componente MenuPage que debe:
   * 1. mostrar todos los productos;
   * 2. desplazarse hacia la carta.
   */
  @Output()
  readonly exploreMenu =
    new EventEmitter<void>();

  handleExploreMenu(
    event: MouseEvent
  ): void {
    event.preventDefault();

    this.exploreMenu.emit();
  }
}