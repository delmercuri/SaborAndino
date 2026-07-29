import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { SaborAndinoApiService } from '../../../../../core/api/sabor-andino-api.service';

interface BranchOrderItem {
  branch: string;
  orders: number;
  percentage: number;
}

@Component({
  selector: 'app-branch-orders-chart',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './branch-orders-chart.html',
  styleUrl: './branch-orders-chart.css'
})
export class BranchOrdersChart implements OnInit {

  constructor(private readonly api: SaborAndinoApiService) {}

  branchOrders: BranchOrderItem[] = [];


  ngOnInit(): void {
    this.api.getDashboard<Record<string, unknown>>().subscribe({
      next: response => {
        if (!response.success || !response.data) return;
        const rows = Array.isArray(response.data['ordersByBranch'])
          ? response.data['ordersByBranch'] as Array<Record<string, unknown>>
          : [];
        const maximum = Math.max(1, ...rows.map(row => Number(row['orders'] ?? 0)));
        this.branchOrders = rows.map(row => ({
          branch: String(row['branch'] ?? ''),
          orders: Number(row['orders'] ?? 0),
          percentage: Math.round((Number(row['orders'] ?? 0) / maximum) * 100)
        }));
      }
    });
  }

}