import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SaborAndinoApiService } from '../../../../core/api/sabor-andino-api.service';

interface FeaturedProduct {
  id: number;
  name: string;
  description: string;
  category: string;
  image: string;
  price: number;
  previousPrice: number | null;
  rating: number;
  reviews: number;
  badge: string;
  badgeClass: string;
  preparationTime: number;
}

@Component({
  selector: 'app-featured-products',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './featured-products.html',
  styleUrl: './featured-products.css'
})
export class FeaturedProducts implements OnInit {

  @ViewChild('featuredProductsContainer')
  featuredProductsContainer?: ElementRef<HTMLDivElement>;

  @Input()
  selectedCategory = 'Todos';

  readonly stars = [1, 2, 3, 4, 5];

  availableCategories: string[] = ['Todos'];

  featuredProducts: FeaturedProduct[] = [];

  readonly favoriteProductIds = new Set<number>();

  constructor(private readonly api: SaborAndinoApiService) {}

  ngOnInit(): void {
    this.api.getPublicProducts<Array<Record<string, unknown>>>().subscribe({
      next: response => {
        if (!response.success || !Array.isArray(response.data) || response.data.length === 0) {
          return;
        }

        const allProducts = response.data.map((item, index) => this.mapProduct(item, index));
        const featured = response.data
          .map((item, index) => ({ item, mapped: this.mapProduct(item, index) }))
          .filter(entry => Boolean(entry.item['featured']))
          .map(entry => entry.mapped);

        this.featuredProducts = (featured.length > 0 ? featured : allProducts).slice(0, 12);
        this.availableCategories = [
          'Todos',
          ...Array.from(new Set<string>(allProducts.map(product => product.category).filter(category => category.length > 0)))
        ];
      },
      error: () => {
        this.featuredProducts = [];
        this.availableCategories = ['Todos'];
      }
    });
  }

  get visibleProducts(): FeaturedProduct[] {
    if (this.selectedCategory === 'Todos') return this.featuredProducts;
    return this.featuredProducts.filter(product => product.category === this.selectedCategory);
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
    window.setTimeout(() => {
      this.featuredProductsContainer?.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
    }, 0);
  }

  scrollFeaturedProducts(direction: 'left' | 'right'): void {
    const container = this.featuredProductsContainer?.nativeElement;
    if (!container) return;
    const card = container.querySelector<HTMLElement>('.product-card');
    const movement = card ? card.offsetWidth + 24 : container.clientWidth * 0.85;
    container.scrollBy({ left: direction === 'right' ? movement : -movement, behavior: 'smooth' });
  }

  addToCart(product: FeaturedProduct): void {
    const current = JSON.parse(localStorage.getItem('sabor-andino-public-cart') ?? '[]') as Array<Record<string, unknown>>;
    const found = current.find(item => Number(item['id']) === product.id);
    if (found) {
      found['quantity'] = Number(found['quantity'] ?? 1) + 1;
    } else {
      current.push({ ...product, quantity: 1 });
    }
    localStorage.setItem('sabor-andino-public-cart', JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('sabor-andino-cart-updated'));
    window.alert(`${product.name} fue agregado al carrito por S/ ${product.price.toFixed(2)}.`);
  }

  viewProduct(product: FeaturedProduct): void {
    window.alert([
      product.name,
      product.description,
      `Precio: S/ ${product.price.toFixed(2)}`,
      `Tiempo estimado: ${product.preparationTime} minutos`
    ].join('\n'));
  }

  toggleFavorite(productId: number): void {
    if (this.favoriteProductIds.has(productId)) this.favoriteProductIds.delete(productId);
    else this.favoriteProductIds.add(productId);
  }

  isFavorite(productId: number): boolean {
    return this.favoriteProductIds.has(productId);
  }

  trackByProductId(_index: number, product: FeaturedProduct): number {
    return product.id;
  }

  private mapProduct(item: Record<string, unknown>, index: number): FeaturedProduct {
    return {
      id: Number(item['id'] ?? index + 1),
      name: String(item['name'] ?? ''),
      description: String(item['description'] ?? ''),
      category: String(item['category'] ?? ''),
      image: String(item['image'] || item['imageUrl'] || '/images/productos/lomo.jpg'),
      price: Number(item['price'] ?? 0),
      previousPrice: item['previousPrice'] == null ? null : Number(item['previousPrice']),
      rating: Number(item['rating'] ?? 0),
      reviews: Number(item['reviews'] ?? 0),
      badge: String(item['badge'] ?? ''),
      badgeClass: String(item['badgeClass'] || 'recommended'),
      preparationTime: Number(item['preparationTime'] ?? 25)
    };
  }
}
