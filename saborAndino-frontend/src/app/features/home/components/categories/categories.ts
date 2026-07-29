import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SaborAndinoApiService } from '../../../../core/api/sabor-andino-api.service';

interface FoodCategory {
  id: number;
  name: string;
  description: string;
  image: string;
  products: number;
  className: string;
}

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './categories.html',
  styleUrl: './categories.css'
})
export class Categories implements OnInit {

  @Output()
  readonly categorySelected = new EventEmitter<string>();

  categories: FoodCategory[] = [];

  constructor(private readonly api: SaborAndinoApiService) {}

  ngOnInit(): void {
    this.api.getPublicCategories<Array<Record<string, unknown>>>().subscribe({
      next: response => {
        if (!response.success || !Array.isArray(response.data) || response.data.length === 0) {
          return;
        }

        this.categories = response.data.map((item, index) => ({
          id: Number(item['id'] ?? index + 1),
          name: String(item['name'] ?? ''),
          description: String(item['description'] ?? ''),
          image: String(item['imageUrl'] || this.categoryFallbackImage(String(item['name'] ?? ''))),
          products: Number(item['productCount'] ?? 0),
          className: this.categoryClass(String(item['name'] ?? ''), index)
        }));
      },
      error: () => {
        this.categories = [];
      }
    });
  }

  selectCategory(categoryName: string): void {
    this.categorySelected.emit(categoryName);

    window.setTimeout(() => {
      document.getElementById('featured-products-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 50);
  }

  trackByCategoryId(_index: number, category: FoodCategory): number {
    return category.id;
  }

  private categoryClass(name: string, index: number): string {
    const normalized = name.toLocaleLowerCase('es');
    if (normalized.includes('marisco')) return 'seafood';
    if (normalized.includes('extra')) return 'extras';
    if (normalized.includes('porcion')) return 'portions';
    if (normalized.includes('bebida')) return 'drinks';
    return index === 0 ? 'main-dishes' : 'main-dishes';
  }

  private categoryFallbackImage(name: string): string {
    const normalized = name.toLocaleLowerCase('es');
    if (normalized.includes('marisco')) return '/images/categorias/Ceviche.png';
    if (normalized.includes('extra')) return '/images/categorias/lomo.jpg';
    if (normalized.includes('porcion')) return '/images/categorias/porcion.jpg';
    if (normalized.includes('bebida')) return '/images/categorias/bebidas.jpg';
    return '/images/categorias/Tallarin.png';
  }
}
