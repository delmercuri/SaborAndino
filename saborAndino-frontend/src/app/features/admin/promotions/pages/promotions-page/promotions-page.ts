import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaborAndinoApiService } from '../../../../../core/api/sabor-andino-api.service';

type PromotionStatus = 'ACTIVA' | 'INACTIVA' | 'FINALIZADA';

interface ProductOption {
  idProduct: string;
  code: string;
  name: string;
  price: number;
  image: string;
}

interface PromotionItem {
  idPromotion: string;
  idProduct: string;
  code: string;
  title: string;
  description: string;
  price: number;
  previousPrice: number | null;
  discount: string;
  image: string;
  startDate: string;
  endDate: string;
  status: PromotionStatus;
  productName: string;
  productCode: string;
  includes: string[];
}

@Component({
  selector: 'app-admin-promotions-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './promotions-page.html',
  styleUrl: './promotions-page.css'
})
export class AdminPromotionsPage implements OnInit {
  promotions: PromotionItem[] = [];
  products: ProductOption[] = [];
  search = '';
  selectedStatus = '';
  editing: PromotionItem | null = null;
  includesText = '';
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';

  readonly statuses: PromotionStatus[] = ['ACTIVA', 'INACTIVA', 'FINALIZADA'];

  constructor(private readonly api: SaborAndinoApiService) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadPromotions();
  }

  get filteredPromotions(): PromotionItem[] {
    const q = this.search.trim().toLocaleLowerCase('es');
    return this.promotions.filter(item => {
      const matchesText = !q || [item.code, item.title, item.productName]
        .some(value => String(value ?? '').toLocaleLowerCase('es').includes(q));
      return matchesText && (!this.selectedStatus || item.status === this.selectedStatus);
    });
  }

  create(): void {
    const product = this.products[0];
    const today = new Date();
    const end = new Date(today);
    end.setMonth(end.getMonth() + 1);
    this.editing = {
      idPromotion: '', idProduct: product?.idProduct ?? '', code: '', title: '', description: '',
      price: product?.price ?? 0, previousPrice: null, discount: '', image: product?.image ?? '',
      startDate: this.isoDate(today), endDate: this.isoDate(end), status: 'ACTIVA',
      productName: product?.name ?? '', productCode: product?.code ?? '', includes: []
    };
    this.includesText = '';
    this.clearMessages();
  }

  edit(item: PromotionItem): void {
    this.editing = { ...item, includes: [...(item.includes ?? [])] };
    this.includesText = this.editing.includes.join('\n');
    this.clearMessages();
  }

  productChanged(): void {
    if (!this.editing) return;
    const product = this.products.find(item => item.idProduct === this.editing?.idProduct);
    if (!product) return;
    this.editing.productName = product.name;
    this.editing.productCode = product.code;
    if (!this.editing.price) this.editing.price = product.price;
    if (!this.editing.image) this.editing.image = product.image;
  }

  save(): void {
    if (!this.editing || this.isSaving) return;
    this.clearMessages();
    if (!this.editing.idProduct || !this.editing.title.trim() || Number(this.editing.price) <= 0) {
      this.errorMessage = 'Selecciona un producto, escribe el título y registra un precio válido.';
      return;
    }
    if (this.editing.startDate && this.editing.endDate && this.editing.endDate < this.editing.startDate) {
      this.errorMessage = 'La fecha final no puede ser anterior a la fecha inicial.';
      return;
    }
    const record: PromotionItem = {
      ...this.editing,
      price: Number(this.editing.price),
      previousPrice: this.editing.previousPrice ? Number(this.editing.previousPrice) : null,
      includes: this.includesText.split(/\r?\n/).map(value => value.trim()).filter(Boolean)
    };
    const payload = this.editing.idPromotion
      ? this.promotions.map(item => item.idPromotion === record.idPromotion ? record : item)
      : [...this.promotions, record];
    this.isSaving = true;
    this.api.syncPromotions(payload).subscribe({
      next: response => {
        this.isSaving = false;
        if (!response.success) { this.errorMessage = response.message; return; }
        this.editing = null;
        this.successMessage = 'Promoción guardada correctamente.';
        this.loadPromotions();
      },
      error: error => {
        this.isSaving = false;
        this.errorMessage = error?.error?.message || 'No se pudo guardar la promoción.';
      }
    });
  }

  remove(item: PromotionItem): void {
    if (!item.idPromotion || !window.confirm(`¿Eliminar la promoción ${item.title}?`)) return;
    this.api.deletePromotion(item.idPromotion).subscribe({
      next: response => {
        if (!response.success) { this.errorMessage = response.message; return; }
        this.successMessage = 'Promoción eliminada.';
        this.loadPromotions();
      },
      error: () => { this.errorMessage = 'No se pudo eliminar la promoción.'; }
    });
  }

  close(): void { if (!this.isSaving) this.editing = null; }
  clearFilters(): void { this.search = ''; this.selectedStatus = ''; }
  statusLabel(value: PromotionStatus): string {
    return { ACTIVA: 'Activa', INACTIVA: 'Inactiva', FINALIZADA: 'Finalizada' }[value];
  }
  formatMoney(value: number | null): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(value ?? 0));
  }
  trackById(_index: number, item: PromotionItem): string { return item.idPromotion || item.code || item.title; }

  private loadPromotions(): void {
    this.isLoading = true;
    this.api.getAdminPromotions<PromotionItem[]>().subscribe({
      next: response => {
        this.isLoading = false;
        this.promotions = response.success && Array.isArray(response.data) ? response.data : [];
      },
      error: () => {
        this.isLoading = false;
        this.promotions = [];
        this.errorMessage = 'No se pudieron cargar las promociones.';
      }
    });
  }

  private loadProducts(): void {
    this.api.getAdminProducts<Array<Record<string, unknown>>>().subscribe({
      next: response => {
        if (!response.success || !Array.isArray(response.data)) return;
        this.products = response.data
          .filter(item => String(item['status'] ?? '').toLowerCase() !== 'inactivo')
          .map(item => ({
            idProduct: String(item['idProduct'] ?? ''),
            code: String(item['code'] ?? ''),
            name: String(item['name'] ?? ''),
            price: Number(item['price'] ?? 0),
            image: String(item['image'] ?? item['imageUrl'] ?? '')
          }))
          .filter(item => item.idProduct && item.name);
      }
    });
  }

  private clearMessages(): void { this.errorMessage = ''; this.successMessage = ''; }
  private isoDate(value: Date): string { return value.toISOString().slice(0, 10); }
}
