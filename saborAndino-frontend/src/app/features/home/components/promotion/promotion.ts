import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { SaborAndinoApiService } from '../../../../core/api/sabor-andino-api.service';

interface PromotionData {
  idPromotion: string;
  code: string;
  title: string;
  description: string;
  price: number;
  previousPrice: number | null;
  discount: string;
  image: string;
  includes: string[];
  idProduct: string;
  productCode: string;
  productName: string;
}

interface PublicBranchContact {
  whatsapp?: string;
  phone?: string;
}

@Component({
  selector: 'app-promotion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './promotion.html',
  styleUrl: './promotion.css'
})
export class Promotion implements OnInit {
  promotion: PromotionData | null = null;
  whatsapp = '';

  constructor(private readonly api: SaborAndinoApiService) {}

  ngOnInit(): void {
    this.loadPromotion();
    this.loadWhatsapp();
  }

  orderPromotion(): void {
    if (!this.promotion) return;
    const storageKey = 'sabor-andino-public-cart';
    let cart: Array<Record<string, unknown>> = [];
    try {
      const value = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
      cart = Array.isArray(value) ? value : [];
    } catch {
      cart = [];
    }

    const current = cart.find(item => String(item['idProduct'] ?? '') === this.promotion?.idProduct);
    if (current) {
      current['quantity'] = Number(current['quantity'] ?? 1) + 1;
    } else {
      cart.push({
        id: this.numericId(this.promotion.productCode),
        idProduct: this.promotion.idProduct,
        code: this.promotion.productCode,
        name: this.promotion.productName,
        image: this.promotion.image,
        price: this.promotion.price,
        quantity: 1
      });
    }

    localStorage.setItem(storageKey, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('sabor-andino-cart-updated'));
    window.dispatchEvent(new CustomEvent('sabor-andino-open-cart'));
  }

  openWhatsApp(): void {
    if (!this.promotion || !this.whatsapp) return;
    const message = encodeURIComponent(
      `Hola Sabor Andino, deseo consultar por la promoción ${this.promotion.title} de S/ ${this.promotion.price.toFixed(2)}.`
    );
    window.open(`https://wa.me/${this.whatsapp}?text=${message}`, '_blank', 'noopener,noreferrer');
  }

  private loadPromotion(): void {
    this.api.getPublicPromotion<PromotionData | null>().subscribe({
      next: response => {
        this.promotion = response.success && response.data ? response.data : null;
      },
      error: () => { this.promotion = null; }
    });
  }

  private loadWhatsapp(): void {
    this.api.getPublicBranches<PublicBranchContact[]>().subscribe({
      next: response => {
        if (!response.success || !Array.isArray(response.data)) return;
        const contact = response.data.find(item => Boolean(item.whatsapp || item.phone));
        this.whatsapp = String(contact?.whatsapp || contact?.phone || '').replace(/\D/g, '');
        if (this.whatsapp.length === 9) this.whatsapp = `51${this.whatsapp}`;
      }
    });
  }

  private numericId(code: string): number {
    const digits = Number(code.replace(/\D/g, ''));
    return Number.isFinite(digits) && digits > 0 ? 900000 + digits : 900001;
  }
}
