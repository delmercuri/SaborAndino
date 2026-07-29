import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaborAndinoApiService } from '../../../../../core/api/sabor-andino-api.service';

type PaymentStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'ANULADO';

interface PaymentItem {
  idPayment: string;
  sourceType: 'PEDIDO' | 'RESERVA';
  sourceCode: string;
  customer: string;
  branch: string;
  paymentMethod: string;
  amount: number;
  reference: string;
  operationDate: string | null;
  notes: string;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-admin-payments-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payments-page.html',
  styleUrl: './payments-page.css'
})
export class AdminPaymentsPage implements OnInit {
  payments: PaymentItem[] = [];
  search = '';
  selectedStatus = '';
  selectedType = '';
  isLoading = false;
  isSaving = false;
  editing: PaymentItem | null = null;
  errorMessage = '';
  successMessage = '';

  readonly statuses: PaymentStatus[] = ['PENDIENTE', 'APROBADO', 'RECHAZADO', 'ANULADO'];

  constructor(private readonly api: SaborAndinoApiService) {}

  ngOnInit(): void { this.loadPayments(); }

  get filteredPayments(): PaymentItem[] {
    const q = this.search.trim().toLocaleLowerCase('es');
    return this.payments.filter(item => {
      const matchesText = !q || [item.sourceCode, item.customer, item.branch, item.reference, item.paymentMethod]
        .some(value => String(value ?? '').toLocaleLowerCase('es').includes(q));
      return matchesText && (!this.selectedStatus || item.status === this.selectedStatus)
        && (!this.selectedType || item.sourceType === this.selectedType);
    });
  }

  get pendingCount(): number { return this.payments.filter(item => item.status === 'PENDIENTE').length; }
  get approvedAmount(): number { return this.payments.filter(item => item.status === 'APROBADO').reduce((sum, item) => sum + Number(item.amount), 0); }

  edit(item: PaymentItem): void {
    this.editing = { ...item };
    this.clearMessages();
  }

  close(): void { if (!this.isSaving) this.editing = null; }

  save(): void {
    if (!this.editing || this.isSaving) return;
    const updated = this.payments.map(item => item.idPayment === this.editing?.idPayment ? { ...this.editing } : item);
    this.isSaving = true;
    this.api.syncPayments(updated).subscribe({
      next: response => {
        this.isSaving = false;
        if (!response.success) { this.errorMessage = response.message; return; }
        this.editing = null;
        this.successMessage = 'Pago actualizado correctamente.';
        this.loadPayments();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'No se pudo actualizar el pago en la base de datos.';
      }
    });
  }

  clearFilters(): void { this.search = ''; this.selectedStatus = ''; this.selectedType = ''; }

  statusLabel(status: PaymentStatus): string {
    return { PENDIENTE: 'Pendiente', APROBADO: 'Aprobado', RECHAZADO: 'Rechazado', ANULADO: 'Anulado' }[status];
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
  }

  formatDate(value: string | null): string {
    if (!value) return 'Sin fecha';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  }

  trackById(_index: number, item: PaymentItem): string { return item.idPayment; }

  private loadPayments(): void {
    this.isLoading = true;
    this.api.getAdminPayments<PaymentItem[]>().subscribe({
      next: response => {
        this.isLoading = false;
        this.payments = response.success && Array.isArray(response.data) ? response.data : [];
      },
      error: () => {
        this.isLoading = false;
        this.payments = [];
        this.errorMessage = 'No se pudieron cargar los pagos desde la base de datos.';
      }
    });
  }

  private clearMessages(): void { this.errorMessage = ''; this.successMessage = ''; }
}
