import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface BranchSearchFilters {
  searchTerm: string;
  district: string;
  service: string;
  status: string;
}

@Component({
  selector: 'app-branches-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './branches-search.html',
  styleUrl: './branches-search.css'
})
export class BranchesSearch {

  /* =====================================================
     OPCIONES RECIBIDAS DESDE BRANCHES PAGE
  ====================================================== */

  @Input()
  districtOptions: string[] = [
    'Todos'
  ];

  @Input()
  serviceOptions: string[] = [
    'Todos'
  ];

  @Input()
  statusOptions: string[] = [
    'Todas'
  ];

  /* =====================================================
     EVENTO PARA COMUNICAR LOS FILTROS
  ====================================================== */

  @Output()
  readonly filtersChanged =
    new EventEmitter<BranchSearchFilters>();

  /* =====================================================
     VALORES DEL FORMULARIO
  ====================================================== */

  searchTerm = '';
  selectedDistrict = 'Todos';
  selectedService = 'Todos';
  selectedStatus = 'Todas';

  /* =====================================================
     CANTIDAD DE FILTROS ACTIVOS
  ====================================================== */

  get activeFiltersCount(): number {
    let count = 0;

    if (this.searchTerm.trim()) {
      count++;
    }

    if (this.selectedDistrict !== 'Todos') {
      count++;
    }

    if (this.selectedService !== 'Todos') {
      count++;
    }

    if (this.selectedStatus !== 'Todas') {
      count++;
    }

    return count;
  }

  /* =====================================================
     COMUNICAR CAMBIOS
  ====================================================== */

  notifyFiltersChange(): void {
    this.filtersChanged.emit({
      searchTerm: this.searchTerm.trim(),
      district: this.selectedDistrict,
      service: this.selectedService,
      status: this.selectedStatus
    });
  }

  /* =====================================================
     LIMPIAR BÚSQUEDA
  ====================================================== */

  clearSearch(): void {
    this.searchTerm = '';
    this.notifyFiltersChange();
  }

  /* =====================================================
     LIMPIAR TODOS LOS FILTROS
  ====================================================== */

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedDistrict = 'Todos';
    this.selectedService = 'Todos';
    this.selectedStatus = 'Todas';

    this.notifyFiltersChange();
  }
}