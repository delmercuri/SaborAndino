import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { SaborAndinoApiService } from '../../../../../core/api/sabor-andino-api.service';

interface ReservationStatus {
  name: string;
  amount: number;
  percentage: number;
  cssClass: string;
}

@Component({
  selector: 'app-reservations-status-chart',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './reservations-status-chart.html',
  styleUrl: './reservations-status-chart.css'
})
export class ReservationsStatusChart implements OnInit {

  constructor(private readonly api: SaborAndinoApiService) {}

  totalReservations = 0;

  reservationStatuses: ReservationStatus[] = [];


  ngOnInit(): void {
    this.api.getDashboard<Record<string, unknown>>().subscribe({
      next: response => {
        if (!response.success || !response.data) return;
        const rows = Array.isArray(response.data['reservationsByStatus'])
          ? response.data['reservationsByStatus'] as Array<Record<string, unknown>>
          : [];
        this.totalReservations = rows.reduce((total, row) => total + Number(row['count'] ?? 0), 0);
        this.reservationStatuses = rows.map(row => {
          const status = String(row['status'] ?? 'PENDIENTE');
          const amount = Number(row['count'] ?? 0);
          return {
            name: this.label(status),
            amount,
            percentage: this.totalReservations ? Number(((amount / this.totalReservations) * 100).toFixed(1)) : 0,
            cssClass: status === 'CANCELADA' ? 'cancelled' : 'confirmed'
          };
        });
      }
    });
  }

  private label(status: string): string {
    const labels: Record<string, string> = {
      PENDIENTE: 'Pendientes', CONFIRMADA: 'Confirmadas', REPROGRAMADA: 'Reprogramadas',
      ATENDIDA: 'Atendidas', CANCELADA: 'Canceladas'
    };
    return labels[status] ?? status;
  }

}