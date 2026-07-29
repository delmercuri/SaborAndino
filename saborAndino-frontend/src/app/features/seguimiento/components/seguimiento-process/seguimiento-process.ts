import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaborAndinoApiService } from '../../../../core/api/sabor-andino-api.service';

interface TrackingStep {
  title: string;
  description: string;
  icon: string;
  completed: boolean;
  active: boolean;
}

interface TrackingOrder {
  code: string;
  phone: string;
  status: string;
  icon: string;
  color: 'blue' | 'orange' | 'green';
  customer: string;
  branch: string;
  orderType: string;
  estimatedTime: string;
  updatedAt: string;
  steps: TrackingStep[];
}

@Component({
  selector: 'app-seguimiento-process',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seguimiento-process.html',
  styleUrl: './seguimiento-process.css'
})
export class SeguimientoProcess {

  orderCode = '';
  phone = '';
  isSearching = false;
  errorMessage = '';
  foundOrder: TrackingOrder | null = null;


  constructor(private readonly api: SaborAndinoApiService) {}

  get canSearch(): boolean {
    return this.orderCode.trim().length >= 5 && this.phone.trim().length === 9;
  }

  sanitizePhone(): void {
    this.phone = this.phone.replace(/\D/g, '').slice(0, 9);
  }



  searchOrder(): void {
    this.errorMessage = '';
    this.foundOrder = null;
    const code = this.orderCode.trim().toUpperCase();
    const phone = this.phone.replace(/\D/g, '');

    if (!code || phone.length !== 9) {
      this.errorMessage = 'Completa el código del pedido y un número de celular de 9 dígitos.';
      return;
    }

    this.isSearching = true;
    this.api.trackOrder<TrackingOrder>(code, phone).subscribe({
      next: response => {
        this.isSearching = false;
        if (!response.success || !response.data) {
          this.errorMessage = response.message || 'No encontramos un pedido con esos datos.';
          return;
        }
        this.foundOrder = response.data;
        window.requestAnimationFrame(() => {
          document.querySelector('.tracking-result-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      },
      error: () => {
        this.isSearching = false;
        this.errorMessage = 'No se pudo consultar el pedido. Verifica que el backend esté ejecutándose.';
      }
    });
  }

  clearSearch(): void {
    this.orderCode = '';
    this.phone = '';
    this.errorMessage = '';
    this.foundOrder = null;
    window.requestAnimationFrame(() => {
      document.getElementById('seguimiento-process')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }


}
