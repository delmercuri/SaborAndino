import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { SaborAndinoApiService } from '../../../core/api/sabor-andino-api.service';

interface CartProduct {
  id: number;
  idProduct?: string;
  code?: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

interface CartBranch {
  id: string;
  name: string;
  address: string;
}

interface OrderConfirmation {
  code: string;
  phone: string;
  subtotal: number;
  deliveryCost: number;
  total: number;
  estimatedMinutes: number;
  status: string;
}

@Component({
  selector: 'app-public-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './public-cart.html',
  styleUrl: './public-cart.css'
})
export class PublicCart implements OnInit {
  readonly storageKey = 'sabor-andino-public-cart';

  items: CartProduct[] = [];
  branches: CartBranch[] = [];
  isOpen = false;
  isSubmitting = false;
  errorMessage = '';
  confirmation: OrderConfirmation | null = null;

  firstName = '';
  lastName = '';
  documentType = 'DNI';
  documentNumber = '';
  phone = '';
  email = '';
  branchId = '';
  orderType: 'Recojo' | 'Delivery' = 'Recojo';
  address = '';
  reference = '';
  paymentMethod = 'Efectivo';
  paymentReference = '';
  notes = '';

  constructor(private readonly api: SaborAndinoApiService) {}

  ngOnInit(): void {
    this.loadCart();
    this.loadBranches();
  }

  @HostListener('window:sabor-andino-cart-updated')
  handleCartUpdated(): void {
    this.loadCart();
  }

  @HostListener('window:sabor-andino-open-cart')
  handleOpenCart(): void {
    this.open();
  }

  @HostListener('document:keydown.escape')
  closeWithEscape(): void {
    if (this.isOpen && !this.isSubmitting) this.close();
  }

  get itemCount(): number {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  get subtotal(): number {
    return this.items.reduce((total, item) => total + item.price * item.quantity, 0);
  }

  get deliveryCost(): number {
    return this.orderType === 'Delivery' ? 5 : 0;
  }

  get total(): number {
    return this.subtotal + this.deliveryCost;
  }

  get canSubmit(): boolean {
    const phoneValid = /^\d{9}$/.test(this.phone);
    const cleanDocument = this.documentNumber.trim();
    const documentValid = this.documentType === 'DNI'
      ? /^\d{8}$/.test(cleanDocument)
      : /^[A-Za-z0-9-]{6,12}$/.test(cleanDocument);
    const emailValid = !this.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
    const addressValid = this.orderType !== 'Delivery' || this.address.trim().length >= 5;
    const referenceValid = this.paymentMethod !== 'Yape' || this.paymentReference.trim().length >= 4;
    return this.items.length > 0 &&
      Boolean(this.firstName.trim() && this.lastName.trim() && this.branchId) &&
      documentValid && phoneValid && emailValid && addressValid && referenceValid;
  }

  open(): void {
    this.loadCart();
    this.errorMessage = '';
    this.confirmation = null;
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
  }

  close(): void {
    this.isOpen = false;
    this.errorMessage = '';
    document.body.style.overflow = '';
  }

  sanitizePhone(): void {
    this.phone = this.phone.replace(/\D/g, '').slice(0, 9);
  }

  sanitizeDocument(): void {
    if (this.documentType === 'DNI') {
      this.documentNumber = this.documentNumber.replace(/\D/g, '').slice(0, 8);
      return;
    }
    this.documentNumber = this.documentNumber.replace(/[^A-Za-z0-9-]/g, '').slice(0, 12);
  }

  changeQuantity(item: CartProduct, delta: number): void {
    item.quantity = Math.max(1, item.quantity + delta);
    this.saveCart();
  }

  remove(item: CartProduct): void {
    this.items = this.items.filter(current => current.id !== item.id);
    this.saveCart();
  }

  clearCart(): void {
    this.items = [];
    this.saveCart();
  }

  submitOrder(): void {
    if (!this.canSubmit || this.isSubmitting) {
      this.errorMessage = 'Completa correctamente los datos obligatorios del pedido.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.api.createOrder<OrderConfirmation>({
      firstName: this.firstName,
      lastName: this.lastName,
      documentType: this.documentType,
      documentNumber: this.documentNumber,
      phone: this.phone,
      email: this.email,
      branchId: this.branchId,
      orderType: this.orderType,
      address: this.address,
      reference: this.reference,
      paymentMethod: this.paymentMethod,
      paymentReference: this.paymentReference,
      notes: this.notes,
      products: this.items.map(item => ({
        idProduct: item.idProduct,
        code: item.code,
        name: item.name,
        quantity: item.quantity
      }))
    }).subscribe({
      next: response => {
        this.isSubmitting = false;
        if (!response.success || !response.data) {
          this.errorMessage = response.message || 'No se pudo registrar el pedido.';
          return;
        }
        this.confirmation = response.data;
        this.clearCart();
      },
      error: () => {
        this.isSubmitting = false;
        this.errorMessage = 'No se pudo conectar con el backend. Verifica que saborandino-api esté activo.';
      }
    });
  }

  trackByItem(_index: number, item: CartProduct): number {
    return item.id;
  }

  private loadCart(): void {
    try {
      const parsed = JSON.parse(localStorage.getItem(this.storageKey) ?? '[]') as CartProduct[];
      this.items = Array.isArray(parsed)
        ? parsed.map(item => ({ ...item, quantity: Math.max(1, Number(item.quantity ?? 1)) }))
        : [];
    } catch {
      this.items = [];
    }
  }

  private saveCart(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    window.dispatchEvent(new CustomEvent('sabor-andino-cart-updated'));
  }

  private loadBranches(): void {
    this.api.getPublicBranches<Array<Record<string, unknown>>>().subscribe({
      next: response => {
        if (!response.success || !Array.isArray(response.data)) return;
        this.branches = response.data.map(item => ({
          id: String(item['idBranch'] || item['code'] || item['id'] || ''),
          name: String(item['name'] ?? ''),
          address: String(item['address'] ?? '')
        }));
        if (!this.branchId && this.branches.length > 0) this.branchId = this.branches[0].id;
      }
    });
  }
}
