import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  HostListener,
  OnDestroy
} from '@angular/core';

import {
  NavigationEnd,
  Router
} from '@angular/router';

import {
  filter,
  Subscription
} from 'rxjs';

import { SaborAndinoApiService } from '../../../core/api/sabor-andino-api.service';

@Component({
  selector: 'app-floating-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './floating-actions.html',
  styleUrl: './floating-actions.css'
})
export class FloatingActions
  implements AfterViewInit, OnDestroy {

  isVisible = false;
  whatsapp = '';

  private routerSubscription?: Subscription;

  private readonly heroSelectors: string[] = [
    '.home-hero',
    '.hero-section',
    '.menu-hero',
    '.branches-hero',
    '.reservations-hero',
    '.seguimiento-hero'
  ];

  constructor(
    private readonly router: Router,
    private readonly api: SaborAndinoApiService
  ) {}

  ngAfterViewInit(): void {
    this.loadWhatsapp();
    this.updateVisibility();

    this.routerSubscription =
      this.router.events
        .pipe(
          filter(
            event => event instanceof NavigationEnd
          )
        )
        .subscribe(() => {
          this.isVisible = false;

          window.setTimeout(() => {
            this.updateVisibility();
          }, 100);
        });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  @HostListener('window:scroll')
  handleWindowScroll(): void {
    this.updateVisibility();
  }

  @HostListener('window:resize')
  handleWindowResize(): void {
    this.updateVisibility();
  }

  openWhatsApp(): void {
    if (!this.whatsapp) return;
    const message = 'Hola, deseo realizar una consulta sobre Sabor Andino.';
    window.open(`https://wa.me/${this.whatsapp}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  }

  private loadWhatsapp(): void {
    this.api.getPublicBranches<Array<{ whatsapp?: string; phone?: string }>>().subscribe({
      next: response => {
        if (!response.success || !Array.isArray(response.data)) return;
        const contact = response.data.find(item => Boolean(item.whatsapp || item.phone));
        this.whatsapp = String(contact?.whatsapp || contact?.phone || '').replace(/\D/g, '');
        if (this.whatsapp.length === 9) this.whatsapp = `51${this.whatsapp}`;
      }
    });
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  private updateVisibility(): void {
    const heroElement =
      this.findCurrentHero();

    if (heroElement) {
      const heroPosition =
        heroElement.getBoundingClientRect();

      /*
       * Los botones aparecen cuando el final
       * del hero ya pasó por encima del encabezado.
       */
      this.isVisible =
        heroPosition.bottom <= 150;

      return;
    }

    /*
     * Respaldo para páginas que no tengan hero.
     */
    this.isVisible =
      window.scrollY >= 350;
  }

  private findCurrentHero(): HTMLElement | null {
    for (
      const selector of this.heroSelectors
    ) {
      const element =
        document.querySelector<HTMLElement>(
          selector
        );

      if (element) {
        return element;
      }
    }

    return document.querySelector<HTMLElement>(
      '.public-main section:first-of-type'
    );
  }
}