import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { SaborAndinoApiService } from '../../../../../core/api/sabor-andino-api.service';

interface OrderStatusItem {
  label: string;
  quantity: number;
  percentage: number;
  cssClass: string;
}

@Component({
  selector: 'app-orders-status-chart',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './orders-status-chart.html',
  styleUrl: './orders-status-chart.css'
})
export class OrdersStatusChart implements OnInit {

  constructor(private readonly api: SaborAndinoApiService) {}

  totalOrders = 0;

  orderStatuses: OrderStatusItem[] = [];


  ngOnInit(): void {
    this.api.getDashboard<Record<string, unknown>>().subscribe({
      next: response => {
        if (!response.success || !response.data) return;
        const rows = Array.isArray(response.data['ordersByStatus'])
          ? response.data['ordersByStatus'] as Array<Record<string, unknown>>
          : [];
        this.totalOrders = rows.reduce((total, row) => total + Number(row['count'] ?? 0), 0);
        this.orderStatuses = rows.map(row => {
          const status = String(row['status'] ?? 'PENDIENTE');
          const quantity = Number(row['count'] ?? 0);
          return {
            label: this.label(status),
            quantity,
            percentage: this.totalOrders ? Number(((quantity / this.totalOrders) * 100).toFixed(1)) : 0,
            cssClass: this.cssClass(status)
          };
        });
      }
    });
  }

  private label(status: string): string {
    const labels: Record<string, string> = {
      PENDIENTE: 'Pendientes', CONFIRMADO: 'Confirmados', EN_PREPARACION: 'En preparación',
      LISTO: 'Listos', EN_CAMINO: 'En camino', ENTREGADO: 'Entregados', CANCELADO: 'Cancelados'
    };
    return labels[status] ?? status;
  }

  private cssClass(status: string): string {
    if (status === 'ENTREGADO') return 'delivered';
    if (status === 'LISTO' || status === 'EN_CAMINO') return 'ready';
    if (status === 'EN_PREPARACION' || status === 'CONFIRMADO') return 'preparing';
    return 'pending';
  }

}