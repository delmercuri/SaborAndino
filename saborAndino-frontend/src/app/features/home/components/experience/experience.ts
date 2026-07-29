import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SaborAndinoApiService } from '../../../../core/api/sabor-andino-api.service';

interface ExperienceBranchContact {
  whatsapp?: string;
  phone?: string;
}

@Component({
  selector: 'app-experience',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './experience.html',
  styleUrl: './experience.css'
})
export class Experience implements OnInit {
  whatsapp = '';

  constructor(private readonly api: SaborAndinoApiService) {}

  ngOnInit(): void {
    this.api.getPublicBranches<ExperienceBranchContact[]>().subscribe({
      next: response => {
        if (!response.success || !Array.isArray(response.data)) return;
        const contact = response.data.find(item => Boolean(item.whatsapp || item.phone));
        this.whatsapp = this.normalizeWhatsapp(contact?.whatsapp || contact?.phone || '');
      }
    });
  }

  openWhatsApp(): void {
    if (!this.whatsapp) return;
    const message = encodeURIComponent(
      'Hola Sabor Andino, deseo obtener más información sobre sus servicios y reservas.'
    );

    window.open(
      `https://wa.me/${this.whatsapp}?text=${message}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  private normalizeWhatsapp(value: string): string {
    let number = String(value || '').replace(/\D/g, '');
    if (number.length === 9) number = `51${number}`;
    return number;
  }
}
