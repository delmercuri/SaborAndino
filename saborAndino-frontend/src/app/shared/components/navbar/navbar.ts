import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  OnDestroy,
  OnInit
} from '@angular/core';
import { SaborAndinoApiService } from '../../../core/api/sabor-andino-api.service';

import {
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

interface NavbarBranchContact {
  phone?: string;
  whatsapp?: string;
  openingHours?: string;
}

interface PublicNavigationItem {
  label: string;
  route: string;
  icon: string;
  exact: boolean;
  description: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnDestroy, OnInit {

  isMobileMenuOpen = false;
  isSearchOpen = false;

  cartItemCount = 0;
  contactPhone = '';
  openingHours = '';
  whatsapp = '';

  constructor(
    private readonly router: Router,
    private readonly api: SaborAndinoApiService
  ) {}

  ngOnInit(): void {
    this.updateCartCount();
    this.loadBranchContact();
  }

  readonly navigationItems: PublicNavigationItem[] = [
    {
      label: 'Inicio',
      route: '/',
      icon: 'home',
      exact: true,
      description:
        'Descubre la experiencia gastronómica de Sabor Andino.'
    },
    {
      label: 'Menú',
      route: '/menu',
      icon: 'restaurant_menu',
      exact: false,
      description:
        'Revisa nuestros platos, bebidas y promociones.'
    },
    {
      label: 'Sucursales',
      route: '/sucursales',
      icon: 'storefront',
      exact: false,
      description:
        'Encuentra el restaurante más cercano.'
    },
    {
      label: 'Reservas',
      route: '/reservas',
      icon: 'calendar_month',
      exact: false,
      description:
        'Separa una mesa para una ocasión especial.'
    },
    {
      label: 'Seguimiento',
      route: '/seguimiento',
      icon: 'local_shipping',
      exact: false,
      description:
        'Consulta el estado y avance de tu pedido.'
    }
  ];

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;

    if (this.isMobileMenuOpen) {
      this.isSearchOpen = false;
    }

    this.updateBodyScroll();
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
    this.updateBodyScroll();
  }

  toggleSearch(): void {
    this.isSearchOpen = !this.isSearchOpen;

    if (this.isSearchOpen) {
      this.isMobileMenuOpen = false;
    }

    this.updateBodyScroll();
  }

  closeSearch(): void {
    this.isSearchOpen = false;
  }

  handleSearch(searchInput: HTMLInputElement): void {
    const searchTerm = searchInput.value.trim();

    if (!searchTerm) {
      window.alert(
        'Escribe el nombre del plato o producto que deseas buscar.'
      );

      searchInput.focus();
      return;
    }

    void this.router.navigate(['/menu'], {
      queryParams: { search: searchTerm }
    });

    searchInput.value = '';
    this.closeSearch();
  }

  searchPopularProduct(
    searchInput: HTMLInputElement,
    productName: string
  ): void {
    searchInput.value = productName;
    this.handleSearch(searchInput);
  }

  openCart(): void {
    void this.router.navigate(['/menu']).then(() => {
      window.setTimeout(() => window.dispatchEvent(new CustomEvent('sabor-andino-open-cart')), 50);
    });
  }

  @HostListener('window:sabor-andino-cart-updated')
  handleCartUpdated(): void {
    this.updateCartCount();
  }

  openWhatsApp(): void {
    if (!this.whatsapp) return;
    const message = encodeURIComponent(
      'Hola Sabor Andino, deseo realizar una consulta.'
    );
    window.open(
      `https://wa.me/${this.whatsapp}?text=${message}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  @HostListener('window:resize')
  handleWindowResize(): void {
    if (
      window.innerWidth > 1050 &&
      this.isMobileMenuOpen
    ) {
      this.closeMobileMenu();
    }
  }

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    this.isMobileMenuOpen = false;
    this.isSearchOpen = false;

    this.updateBodyScroll();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }


  private loadBranchContact(): void {
    this.api.getPublicBranches<NavbarBranchContact[]>().subscribe({
      next: response => {
        if (!response.success || !Array.isArray(response.data)) return;
        const contact = response.data.find(item => Boolean(item.whatsapp || item.phone));
        if (!contact) return;

        this.contactPhone = String(contact.phone || '');
        this.openingHours = String(contact.openingHours || '');
        this.whatsapp = this.normalizeWhatsapp(contact.whatsapp || contact.phone || '');
      }
    });
  }

  private normalizeWhatsapp(value: string): string {
    let number = String(value || '').replace(/\D/g, '');
    if (number.length === 9) number = `51${number}`;
    return number;
  }

  private updateCartCount(): void {
    try {
      const cart = JSON.parse(localStorage.getItem('sabor-andino-public-cart') ?? '[]') as Array<{ quantity?: number }>;
      this.cartItemCount = Array.isArray(cart)
        ? cart.reduce((total, item) => total + Math.max(1, Number(item.quantity ?? 1)), 0)
        : 0;
    } catch {
      this.cartItemCount = 0;
    }
  }

  private updateBodyScroll(): void {
    document.body.style.overflow =
      this.isMobileMenuOpen
        ? 'hidden'
        : '';
  }
}