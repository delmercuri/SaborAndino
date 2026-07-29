import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SaborAndinoApiService } from '../../../core/api/sabor-andino-api.service';

interface FooterBranch {
  address?: string;
  district?: string;
  department?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  openingHours?: string;
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css'
})
export class Footer implements OnInit {
  readonly currentYear = new Date().getFullYear();
  contact: FooterBranch | null = null;
  whatsapp = '';

  constructor(private readonly api: SaborAndinoApiService) {}

  ngOnInit(): void {
    this.api.getPublicBranches<FooterBranch[]>().subscribe({
      next: response => {
        if (!response.success || !Array.isArray(response.data) || response.data.length === 0) return;
        this.contact = response.data[0];
        this.whatsapp = String(this.contact.whatsapp || this.contact.phone || '').replace(/\D/g, '');
        if (this.whatsapp.length === 9) this.whatsapp = `51${this.whatsapp}`;
      }
    });
  }

  get locationLabel(): string {
    if (!this.contact) return '';
    return [this.contact.address, this.contact.district, this.contact.department].filter(Boolean).join(', ');
  }

  openWhatsApp(): void {
    if (!this.whatsapp) return;
    const message = encodeURIComponent('Hola Sabor Andino, deseo realizar una consulta.');
    window.open(`https://wa.me/${this.whatsapp}?text=${message}`, '_blank', 'noopener,noreferrer');
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
