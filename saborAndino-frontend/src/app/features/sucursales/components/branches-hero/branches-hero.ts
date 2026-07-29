import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

@Component({
  selector: 'app-branches-hero',
  standalone: true,
  imports: [
    RouterLink
  ],
  templateUrl: './branches-hero.html',
  styleUrl: './branches-hero.css'
})
export class BranchesHero {

  /*
   * Estos valores llegan desde la página principal.
   * Más adelante se calcularán usando la lista real
   * de sucursales.
   */

  @Input()
  totalBranches = 6;

  @Input()
  openBranches = 5;

  @Input()
  totalLocations = 6;

  /*
   * Informa a BranchesPage que debe desplazarse
   * hacia el listado de sucursales.
   */

  @Output()
  readonly viewBranches =
    new EventEmitter<void>();

  requestBranches(): void {
    this.viewBranches.emit();
  }
}