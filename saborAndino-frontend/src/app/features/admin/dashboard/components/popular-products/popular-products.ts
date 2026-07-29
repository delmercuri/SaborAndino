import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { SaborAndinoApiService } from '../../../../../core/api/sabor-andino-api.service';

interface PopularProductItem {
  name: string;
  orders: number;
  percentage: number;
}

@Component({
  selector: 'app-popular-products',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './popular-products.html',
  styleUrl: './popular-products.css'
})
export class PopularProducts implements OnInit {

  constructor(private readonly api: SaborAndinoApiService) {}

  products: PopularProductItem[] = [];


  ngOnInit(): void {
    this.api.getDashboard<Record<string, unknown>>().subscribe({
      next: response => {
        if (!response.success || !response.data) return;
        const rows = Array.isArray(response.data['popularProducts'])
          ? response.data['popularProducts'] as Array<Record<string, unknown>>
          : [];
        const maximum = Math.max(1, ...rows.map(row => Number(row['quantity'] ?? 0)));
        this.products = rows.map(row => ({
          name: String(row['name'] ?? ''),
          orders: Number(row['quantity'] ?? 0),
          percentage: Math.round((Number(row['quantity'] ?? 0) / maximum) * 100)
        }));
      }
    });
  }

}