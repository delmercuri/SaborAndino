import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';

import { SaborAndinoApiService } from '../../../../core/api/sabor-andino-api.service';
import { BranchSearchFilters } from '../branches-search/branches-search';

interface BranchData {
  id: number;
  name: string;
  district: string;
  city: string;
  address: string;
  reference: string;
  phone: string;
  whatsapp: string;
  deliveryTime: string;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  isOpen: boolean;
  isFeatured: boolean;
  services: string[];
  capacity: number;
  tables: number;
  openingTime: string;
  mapsUrl?: string;
}

@Component({
  selector: 'app-branches-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './branches-list.html',
  styleUrl: './branches-list.css'
})
export class BranchesList implements OnChanges, OnInit {

  @ViewChild('branchesCarousel')
  branchesCarousel?: ElementRef<HTMLDivElement>;

  @Input()
  filters: BranchSearchFilters = {
    searchTerm: '',
    district: 'Todos',
    service: 'Todos',
    status: 'Todas'
  };

  @Output()
  readonly clearFiltersRequested = new EventEmitter<void>();

  branches: BranchData[] = [];
  isLoading = true;
  loadError = '';

  constructor(private readonly api: SaborAndinoApiService) {}

  ngOnInit(): void {
    this.loadBranches();
  }

  get filteredBranches(): BranchData[] {
    const search = this.normalizeText(this.filters.searchTerm);
    return this.branches.filter(branch => {
      const searchable = this.normalizeText([
        branch.name,
        branch.district,
        branch.city,
        branch.address,
        branch.reference
      ].join(' '));

      const matchesSearch = !search || searchable.includes(search);
      const matchesDistrict = this.filters.district === 'Todos' || branch.district === this.filters.district;
      const matchesService = this.filters.service === 'Todos' || branch.services.includes(this.filters.service);
      const matchesStatus = this.filters.status === 'Todas' ||
        (this.filters.status === 'Abiertas ahora' && branch.isOpen) ||
        (this.filters.status === 'Destacadas' && branch.isFeatured);

      return matchesSearch && matchesDistrict && matchesService && matchesStatus;
    });
  }

  get openFilteredBranches(): number {
    return this.filteredBranches.filter(branch => branch.isOpen).length;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['filters']) return;
    window.requestAnimationFrame(() => {
      this.branchesCarousel?.nativeElement.scrollTo({ left: 0, behavior: 'smooth' });
    });
  }

  moveCarousel(direction: 'left' | 'right'): void {
    const carousel = this.branchesCarousel?.nativeElement;
    if (!carousel) return;
    const card = carousel.querySelector<HTMLElement>('.branch-card');
    const movement = (card?.offsetWidth ?? carousel.clientWidth * 0.85) + 20;
    carousel.scrollBy({ left: direction === 'right' ? movement : -movement, behavior: 'smooth' });
  }

  openBranchDetails(branch: BranchData): void {
    window.alert([
      branch.name,
      branch.address,
      `Teléfono: ${branch.phone}`,
      `Horario de apertura: ${branch.openingTime}`,
      `Delivery: ${branch.deliveryTime}`,
      `Capacidad: ${branch.capacity} personas`,
      `Servicios: ${branch.services.join(', ')}`
    ].join('\n'));
  }

  openBranchLocation(branch: BranchData): void {
    const url = branch.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(branch.address)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  openWhatsApp(branch: BranchData): void {
    const number = branch.whatsapp.replace(/\D/g, '');
    if (!number) {
      window.alert('Esta sucursal aún no tiene un número de WhatsApp registrado.');
      return;
    }
    const message = encodeURIComponent(`Hola Sabor Andino, deseo consultar sobre la sede ${branch.name}.`);
    window.open(`https://wa.me/${number}?text=${message}`, '_blank', 'noopener,noreferrer');
  }

  getServiceIcon(service: string): string {
    const icons: Record<string, string> = {
      'Atención en salón': 'restaurant',
      'Salón': 'restaurant',
      'Delivery': 'delivery_dining',
      'Recojo en tienda': 'takeout_dining',
      'Recojo': 'takeout_dining',
      'Reservas': 'calendar_month',
      'Eventos': 'celebration',
      'Estacionamiento': 'local_parking'
    };
    return icons[service] ?? 'check_circle';
  }

  requestClearFilters(): void {
    this.clearFiltersRequested.emit();
  }

  retryLoadBranches(): void {
    this.loadBranches();
  }

  trackByBranchId(_index: number, branch: BranchData): number {
    return branch.id;
  }

  private loadBranches(): void {
    this.isLoading = true;
    this.loadError = '';
    this.api.getPublicBranches<Array<Record<string, unknown>>>().subscribe({
      next: response => {
        this.isLoading = false;
        if (!response.success || !Array.isArray(response.data)) {
          this.loadError = response.message || 'No se pudieron obtener las sucursales.';
          return;
        }
        this.branches = response.data.map((item, index) => ({
          id: Number(item['id'] ?? index + 1),
          name: String(item['name'] ?? ''),
          district: String(item['district'] ?? ''),
          city: String(item['department'] ?? item['province'] ?? ''),
          address: String(item['address'] ?? ''),
          reference: String(item['reference'] ?? ''),
          phone: String(item['phone'] ?? ''),
          whatsapp: String(item['whatsapp'] ?? ''),
          deliveryTime: String(item['deliveryTime'] || '30 a 45 minutos'),
          description: String(item['description'] ?? ''),
          image: String(item['imageUrl'] || '/images/sucursales/abancay.png'),
          rating: Number(item['rating'] ?? 0),
          reviews: Number(item['reviews'] ?? 0),
          isOpen: String(item['status'] ?? '').toLocaleLowerCase('es') === 'activa',
          isFeatured: Boolean(item['isFeatured']),
          services: Array.isArray(item['services']) ? item['services'].map(String) : [],
          capacity: Number(item['capacity'] ?? 0),
          tables: Number(item['tableCount'] ?? 0),
          openingTime: this.formatTime(String(item['openingTime'] ?? '')),
          mapsUrl: String(item['mapsUrl'] ?? '')
        }));
      },
      error: () => {
        this.isLoading = false;
        this.loadError = 'No se pudo conectar con el backend.';
      }
    });
  }

  private formatTime(value: string): string {
    const [hourText, minute = '00'] = value.split(':');
    const hour = Number(hourText);
    if (!Number.isFinite(hour)) return value;
    const suffix = hour >= 12 ? 'p. m.' : 'a. m.';
    const display = hour % 12 || 12;
    return `${display}:${minute} ${suffix}`;
  }

  private normalizeText(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }
}
