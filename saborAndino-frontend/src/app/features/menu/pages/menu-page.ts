import {
  Component,
  ViewChild
} from '@angular/core';

import {
  MenuHero
} from '../components/menu-hero/menu-hero';

import {
  MenuCatalog
} from '../components/menu-catalog/menu-catalog';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [
    MenuHero,
    MenuCatalog
  ],
  templateUrl: './menu-page.html',
  styleUrl: './menu-page.css'
})
export class MenuPage {

  @ViewChild(MenuCatalog)
  private menuCatalog?: MenuCatalog;

  showFullMenu(): void {
    this.menuCatalog?.showAllProducts();
  }
}