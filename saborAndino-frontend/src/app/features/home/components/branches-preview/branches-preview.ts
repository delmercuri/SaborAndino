import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SaborAndinoApiService } from '../../../../core/api/sabor-andino-api.service';

interface BranchPreviewData {
  id: number;
  name: string;
  address: string;
  schedule: string;
  phone: string;
  reference: string;
  className: string;
  services: string[];
  image: string;
  mapsUrl?: string;
}

@Component({
  selector: 'app-branches-preview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './branches-preview.html',
  styleUrl: './branches-preview.css'
})
export class BranchesPreview implements OnInit {

  branches: BranchPreviewData[] = [];

  constructor(private readonly api: SaborAndinoApiService) {}

  ngOnInit(): void {
    this.api.getPublicBranches<Array<Record<string, unknown>>>().subscribe({
      next: response => {
        if (!response.success || !Array.isArray(response.data) || response.data.length === 0) return;
        const sorted = [...response.data].sort((a, b) => Number(Boolean(b['isFeatured'])) - Number(Boolean(a['isFeatured'])));
        this.branches = sorted.slice(0, 3).map((item, index) => ({
          id: Number(item['id'] ?? index + 1),
          name: String(item['name'] ?? ''),
          address: String(item['address'] ?? ''),
          schedule: String(item['openingHours'] ?? ''),
          phone: String(item['phone'] ?? ''),
          reference: String(item['reference'] ?? ''),
          className: this.branchClass(String(item['department'] ?? item['location'] ?? ''), index),
          services: Array.isArray(item['services']) ? item['services'].map(String) : [],
          image: String(item['imageUrl'] || '/images/sucursales/abancay.png'),
          mapsUrl: String(item['mapsUrl'] ?? '')
        }));
      },
      error: () => {
        this.branches = [];
      }
    });
  }

  openBranchLocation(branch: BranchPreviewData): void {
    const url = branch.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  handleBranchImageKeydown(event: KeyboardEvent, branch: BranchPreviewData): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.openBranchLocation(branch);
  }

  callBranch(branch: BranchPreviewData): void {
    const number = branch.phone.replace(/[^0-9+]/g, '');
    if (!number) {
      window.alert(`El número telefónico de ${branch.name} todavía está por confirmar.`);
      return;
    }
    window.location.href = `tel:${number}`;
  }

  trackByBranchId(_index: number, branch: BranchPreviewData): number {
    return branch.id;
  }

  private branchClass(location: string, index: number): string {
    const value = location.toLocaleLowerCase('es');
    if (value.includes('apur')) return 'apurimac';
    if (value.includes('ayac')) return 'ayacucho';
    return index === 0 ? 'lima' : 'lima';
  }
}
