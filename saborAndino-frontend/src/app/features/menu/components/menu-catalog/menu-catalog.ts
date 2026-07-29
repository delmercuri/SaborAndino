import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { SaborAndinoApiService } from '../../../../core/api/sabor-andino-api.service';
import { PublicCart } from '../../../../shared/components/public-cart/public-cart';

interface MenuCategory {
  id: number;
  name: string;
  icon: string;
}

interface MenuProduct {
  id: number;
  idProduct?: string;
  code?: string;
  name: string;
  description: string;
  category: string;
  image: string;
  price: number;
  previousPrice: number | null;
  rating: number;
  reviews: number;
  preparationTime: number;
  available: boolean;
  featured: boolean;
  badge: string;
  badgeClass: string;
  spicyLevel: number;
  dietaryTags: string[];
  ingredients: string[];
}

@Component({
  selector: 'app-menu-catalog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PublicCart
  ],
  templateUrl: './menu-catalog.html',
  styleUrl: './menu-catalog.css'
})
export class MenuCatalog implements OnInit {

  /* =====================================================
     FILTROS Y ESTADO
  ====================================================== */

  searchTerm = '';
  selectedCategory = 'Todos';
  selectedDietary = 'Todos';
  selectedPriceRange = 'Todos';
  selectedSort = 'Destacados';

  selectedProduct: MenuProduct | null = null;
  isProductModalOpen = false;

  cartQuantity = 0;

  private readonly fallbackProductImage =
    '/images/productos/lomo.jpg';

  /* =====================================================
     OPCIONES DE FILTRO
  ====================================================== */

  readonly dietaryOptions: string[] = [
    'Todos',
    'Vegetariano',
    'Sin gluten',
    'Picante'
  ];

  readonly priceRanges: string[] = [
    'Todos',
    'Hasta S/ 20',
    'S/ 20 a S/ 30',
    'Más de S/ 30'
  ];

  readonly sortOptions: string[] = [
    'Destacados',
    'Precio: menor a mayor',
    'Precio: mayor a menor',
    'Mejor valorados',
    'Nombre'
  ];

  /* =====================================================
     CATEGORÍAS
  ====================================================== */

  categories: MenuCategory[] = [];

  /* =====================================================
     PRODUCTOS
  ====================================================== */

  products: MenuProduct[] = [];

  constructor(
    private readonly api: SaborAndinoApiService,
    private readonly route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.searchTerm = this.route.snapshot.queryParamMap.get('search')?.trim() ?? '';
    this.loadCatalog();
  }

  /* =====================================================
     PROPIEDADES CALCULADAS
  ====================================================== */

  get categoryNames(): string[] {
    return [
      'Todos',
      ...this.categories.map(category => category.name)
    ];
  }

  get filteredProducts(): MenuProduct[] {
    const normalizedSearch =
      this.normalizeText(this.searchTerm);

    const filteredProducts =
      this.products.filter(product => {
        const matchesSearch =
          !normalizedSearch ||
          this.normalizeText(product.name)
            .includes(normalizedSearch) ||
          this.normalizeText(product.description)
            .includes(normalizedSearch) ||
          this.normalizeText(product.category)
            .includes(normalizedSearch) ||
          product.ingredients.some(ingredient =>
            this.normalizeText(ingredient)
              .includes(normalizedSearch)
          );

        const matchesCategory =
          this.selectedCategory === 'Todos' ||
          this.normalizeText(product.category) ===
            this.normalizeText(this.selectedCategory);

        const matchesDietary =
          this.selectedDietary === 'Todos' ||
          product.dietaryTags.includes(
            this.selectedDietary
          );

        const matchesPrice =
          this.matchesSelectedPriceRange(
            product.price
          );

        return (
          matchesSearch &&
          matchesCategory &&
          matchesDietary &&
          matchesPrice
        );
      });

    return this.sortProducts(filteredProducts);
  }

  get resultCount(): number {
    return this.filteredProducts.length;
  }

  get availableProductCount(): number {
    return this.filteredProducts.filter(
      product => product.available
    ).length;
  }

  get activeFiltersCount(): number {
    let count = 0;

    if (this.searchTerm.trim()) {
      count++;
    }

    if (this.selectedCategory !== 'Todos') {
      count++;
    }

    if (this.selectedDietary !== 'Todos') {
      count++;
    }

    if (this.selectedPriceRange !== 'Todos') {
      count++;
    }

    if (this.selectedSort !== 'Destacados') {
      count++;
    }

    return count;
  }

  /* =====================================================
     IMÁGENES
  ====================================================== */

  getProductImage(productId: number): string {
    return (
      this.products.find(
        product => product.id === productId
      )?.image ??
      this.fallbackProductImage
    );
  }

  onProductImageError(event: Event): void {
    const image =
      event.target as HTMLImageElement;

    if (
      image.dataset['fallbackApplied'] ===
      'true'
    ) {
      return;
    }

    image.dataset['fallbackApplied'] = 'true';
    image.src = this.fallbackProductImage;
  }

  /* =====================================================
     CATEGORÍAS
  ====================================================== */

  getCategoryProductCount(
    categoryName: string
  ): number {
    const normalizedCategory =
      this.normalizeText(categoryName);

    return this.products.filter(
      product =>
        this.normalizeText(product.category) ===
        normalizedCategory
    ).length;
  }

  selectCategory(category: string): void {
    this.selectedCategory = category;
  }

  showAllProducts(): void {
    this.clearFilters();

    window.requestAnimationFrame(() => {
      document.getElementById('menu-content')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
    });
  }

  /* =====================================================
     FILTROS
  ====================================================== */

  clearSearch(): void {
    this.searchTerm = '';
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = 'Todos';
    this.selectedDietary = 'Todos';
    this.selectedPriceRange = 'Todos';
    this.selectedSort = 'Destacados';
  }

  /* =====================================================
     MODAL
  ====================================================== */

  openProductDetail(
    product: MenuProduct
  ): void {
    this.selectedProduct = product;
    this.isProductModalOpen = true;

    document.body.style.overflow = 'hidden';
  }

  closeProductDetail(): void {
    this.selectedProduct = null;
    this.isProductModalOpen = false;

    document.body.style.overflow = '';
  }

  /* =====================================================
     CARRITO
  ====================================================== */

  addToCart(product: MenuProduct): void {
    if (!product.available) {
      window.alert(`${product.name} no se encuentra disponible en este momento.`);
      return;
    }

    const storageKey = 'sabor-andino-public-cart';
    let cart: Array<MenuProduct & { quantity: number }> = [];
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) ?? '[]');
      cart = Array.isArray(stored) ? stored : [];
    } catch {
      cart = [];
    }

    const current = cart.find(item => item.id === product.id);
    if (current) current.quantity += 1;
    else cart.push({ ...product, quantity: 1 });

    localStorage.setItem(storageKey, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent('sabor-andino-cart-updated'));
    this.cartQuantity = cart.reduce((total, item) => total + item.quantity, 0);
  }

  addSelectedProductToCart(): void {
    if (!this.selectedProduct) {
      return;
    }

    const productWasAvailable =
      this.selectedProduct.available;

    this.addToCart(this.selectedProduct);

    if (productWasAvailable) {
      this.closeProductDetail();
    }
  }

  /* =====================================================
     INFORMACIÓN DEL PRODUCTO
  ====================================================== */

  getDiscountPercentage(
    product: MenuProduct
  ): number {
    if (
      !product.previousPrice ||
      product.previousPrice <= product.price
    ) {
      return 0;
    }

    return Math.round(
      (
        (
          product.previousPrice -
          product.price
        ) /
        product.previousPrice
      ) * 100
    );
  }

  getSpicyLevelText(level: number): string {
    switch (level) {
      case 1:
        return 'Picante suave';

      case 2:
        return 'Picante medio';

      case 3:
        return 'Muy picante';

      default:
        return 'Sin picante';
    }
  }

  /* =====================================================
     TRACK BY
  ====================================================== */

  trackByProductId(
    _index: number,
    product: MenuProduct
  ): number {
    return product.id;
  }

  trackByCategoryId(
    _index: number,
    category: MenuCategory
  ): number {
    return category.id;
  }

  /* =====================================================
     EVENTOS DEL TECLADO
  ====================================================== */

  @HostListener('document:keydown.escape')
  handleEscapeKey(): void {
    if (this.isProductModalOpen) {
      this.closeProductDetail();
    }
  }

  /* =====================================================
     MÉTODOS PRIVADOS
  ====================================================== */

  private loadCatalog(): void {
    this.api.getPublicCategories<Array<Record<string, unknown>>>().subscribe({
      next: response => {
        if (!response.success || !Array.isArray(response.data) || response.data.length === 0) return;
        this.categories = response.data.map((item, index) => ({
          id: Number(item['id'] ?? index + 1),
          name: String(item['name'] ?? ''),
          icon: String(item['icon'] || this.categoryIcon(String(item['name'] ?? '')))
        }));
      }
    });

    this.api.getPublicProducts<Array<Record<string, unknown>>>().subscribe({
      next: response => {
        if (!response.success || !Array.isArray(response.data) || response.data.length === 0) return;
        this.products = response.data.map((item, index) => ({
          id: Number(item['id'] ?? index + 1),
          idProduct: String(item['idProduct'] ?? ''),
          code: String(item['code'] ?? ''),
          name: String(item['name'] ?? ''),
          description: String(item['description'] ?? ''),
          category: String(item['category'] ?? ''),
          image: String(item['image'] || item['imageUrl'] || this.fallbackProductImage),
          price: Number(item['price'] ?? 0),
          previousPrice: item['previousPrice'] == null ? null : Number(item['previousPrice']),
          rating: Number(item['rating'] ?? 0),
          reviews: Number(item['reviews'] ?? 0),
          preparationTime: Number(item['preparationTime'] ?? 25),
          available: Boolean(item['available']),
          featured: Boolean(item['featured']),
          badge: String(item['badge'] ?? ''),
          badgeClass: String(item['badgeClass'] || 'recommended'),
          spicyLevel: Number(item['spicyLevel'] ?? 0),
          dietaryTags: Array.isArray(item['dietaryTags']) ? item['dietaryTags'].map(String) : [],
          ingredients: Array.isArray(item['ingredients']) ? item['ingredients'].map(String) : []
        }));
      }
    });
  }

  private categoryIcon(name: string): string {
    const value = this.normalizeText(name);
    if (value.includes('marisco')) return 'set_meal';
    if (value.includes('bebida')) return 'local_drink';
    if (value.includes('porcion')) return 'fastfood';
    if (value.includes('extra')) return 'add_circle';
    return 'soup_kitchen';
  }

  private normalizeText(value: string): string {
    return value
      .trim()
      .toLocaleLowerCase('es')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  private matchesSelectedPriceRange(
    price: number
  ): boolean {
    switch (this.selectedPriceRange) {
      case 'Hasta S/ 20':
        return price <= 20;

      case 'S/ 20 a S/ 30':
        return price > 20 && price <= 30;

      case 'Más de S/ 30':
        return price > 30;

      default:
        return true;
    }
  }

  private sortProducts(
    products: MenuProduct[]
  ): MenuProduct[] {
    const sortedProducts = [...products];

    switch (this.selectedSort) {
      case 'Precio: menor a mayor':
        return sortedProducts.sort(
          (firstProduct, secondProduct) =>
            firstProduct.price -
            secondProduct.price
        );

      case 'Precio: mayor a menor':
        return sortedProducts.sort(
          (firstProduct, secondProduct) =>
            secondProduct.price -
            firstProduct.price
        );

      case 'Mejor valorados':
        return sortedProducts.sort(
          (firstProduct, secondProduct) =>
            secondProduct.rating -
            firstProduct.rating
        );

      case 'Nombre':
        return sortedProducts.sort(
          (firstProduct, secondProduct) =>
            firstProduct.name.localeCompare(
              secondProduct.name,
              'es'
            )
        );

      default:
        return sortedProducts.sort(
          (firstProduct, secondProduct) => {
            if (
              firstProduct.available !==
              secondProduct.available
            ) {
              return firstProduct.available
                ? -1
                : 1;
            }

            if (
              firstProduct.featured !==
              secondProduct.featured
            ) {
              return firstProduct.featured
                ? -1
                : 1;
            }

            return (
              secondProduct.rating -
              firstProduct.rating
            );
          }
        );
    }
  }
}