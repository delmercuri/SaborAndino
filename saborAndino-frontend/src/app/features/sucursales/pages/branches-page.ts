import {
  Component,
  ViewChild
} from '@angular/core';

import {
  BranchesHero
} from '../components/branches-hero/branches-hero';

import {
  BranchesSearch,
  BranchSearchFilters
} from '../components/branches-search/branches-search';

import {
  BranchesList
} from '../components/branches-list/branches-list';

@Component({
  selector: 'app-branches-page',
  standalone: true,
  imports: [
    BranchesHero,
    BranchesSearch,
    BranchesList
  ],
  templateUrl: './branches-page.html',
  styleUrl: './branches-page.css'
})
export class BranchesPage {

  @ViewChild(BranchesSearch)
  private branchesSearch?: BranchesSearch;

  readonly totalBranches = 6;
  readonly openBranches = 5;

  readonly districtOptions: string[] = [
    'Todos',
    'Miraflores',
    'San Miguel',
    'Abancay',
    'Andahuaylas',
    'Huamanga',
    'Huanta'
  ];

  readonly serviceOptions: string[] = [
    'Todos',
    'Atención en salón',
    'Delivery',
    'Recojo en tienda',
    'Reservas',
    'Eventos',
    'Estacionamiento'
  ];

  readonly statusOptions: string[] = [
    'Todas',
    'Abiertas ahora',
    'Destacadas'
  ];

  branchFilters: BranchSearchFilters = {
    searchTerm: '',
    district: 'Todos',
    service: 'Todos',
    status: 'Todas'
  };

  get totalLocations(): number {
    return this.districtOptions.length - 1;
  }

  onFiltersChanged(
    filters: BranchSearchFilters
  ): void {
    this.branchFilters = filters;
  }

  clearBranchFilters(): void {
    this.branchesSearch?.clearFilters();
  }

  scrollToBranches(): void {
    window.requestAnimationFrame(() => {
      document
        .getElementById('branches-content')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
    });
  }
}