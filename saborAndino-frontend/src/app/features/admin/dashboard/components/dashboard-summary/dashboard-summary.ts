import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { SaborAndinoApiService } from '../../../../../core/api/sabor-andino-api.service';

interface DashboardSummaryItem {
  title: string;
  value: number;
  icon: string;
  cssClass: string;
  trend: string;
  trendType: 'positive' | 'negative' | 'neutral';
  comparison: string;
  sparkline: string;
}

@Component({
  selector: 'app-dashboard-summary',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './dashboard-summary.html',
  styleUrl: './dashboard-summary.css'
})
export class DashboardSummary implements OnInit {

  constructor(private readonly api: SaborAndinoApiService) {}

  summaryItems: DashboardSummaryItem[] = [];


  ngOnInit(): void {
    this.api.getDashboard<Record<string, unknown>>().subscribe({
      next: response => {
        if (!response.success || !response.data) return;
        const data = response.data;
        const orderStatuses = Array.isArray(data['ordersByStatus']) ? data['ordersByStatus'] as Array<Record<string, unknown>> : [];
        const reservationStatuses = Array.isArray(data['reservationsByStatus']) ? data['reservationsByStatus'] as Array<Record<string, unknown>> : [];
        const totalOrders = orderStatuses.reduce((sum, row) => sum + Number(row['count'] ?? 0), 0);
        const delivered = orderStatuses.filter(row => String(row['status']) === 'ENTREGADO').reduce((sum, row) => sum + Number(row['count'] ?? 0), 0);
        const confirmedReservations = reservationStatuses.filter(row => String(row['status']) === 'CONFIRMADA').reduce((sum, row) => sum + Number(row['count'] ?? 0), 0);
        const cancelledReservations = reservationStatuses.filter(row => String(row['status']) === 'CANCELADA').reduce((sum, row) => sum + Number(row['count'] ?? 0), 0);
        const spark = '0,24 15,18 30,22 45,15 60,20 75,12 90,17 105,9 120,15 135,8 150,13 165,7 180,11 195,5 210,9';
        this.summaryItems = [
          this.item('Total de pedidos', totalOrders, 'room_service', 'wine', spark),
          this.item('Pedidos de hoy', Number(data['ordersToday'] ?? 0), 'today', 'gold', spark),
          this.item('Pedidos pendientes', Number(data['pendingOrders'] ?? 0), 'schedule', 'red', spark),
          this.item('Pedidos entregados', delivered, 'delivery_dining', 'green', spark),
          this.item('Reservas de hoy', Number(data['reservationsToday'] ?? 0), 'calendar_month', 'olive', spark),
          this.item('Reservas confirmadas', confirmedReservations, 'event_available', 'amber', spark),
          this.item('Reservas canceladas', cancelledReservations, 'event_busy', 'cancelled', spark),
          this.item('Productos activos', Number(data['activeProducts'] ?? 0), 'inventory_2', 'black', spark)
        ];
      }
    });
  }

  private item(title: string, value: number, icon: string, cssClass: string, sparkline: string): DashboardSummaryItem {
    return { title, value, icon, cssClass, trend: 'Datos reales', trendType: 'neutral', comparison: 'base de datos', sparkline };
  }

}