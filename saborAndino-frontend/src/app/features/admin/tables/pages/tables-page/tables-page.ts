import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaborAndinoApiService } from '../../../../../core/api/sabor-andino-api.service';

type TableStatus = 'DISPONIBLE' | 'OCUPADA' | 'RESERVADA' | 'MANTENIMIENTO' | 'INACTIVA';

interface BranchOption {
  idBranch: string;
  code: string;
  name: string;
}

interface RestaurantTableItem {
  id: number;
  idRestaurantTable: string;
  idBranch: string;
  branchCode: string;
  branch: string;
  tableNumber: string;
  capacity: number;
  location: string;
  status: TableStatus;
}

interface TableForm {
  idRestaurantTable: string;
  idBranch: string;
  tableNumber: string;
  capacity: number;
  location: string;
  status: TableStatus;
}

@Component({
  selector: 'app-admin-tables-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tables-page.html',
  styleUrl: './tables-page.css'
})
export class AdminTablesPage implements OnInit {
  tables: RestaurantTableItem[] = [];
  branches: BranchOption[] = [];

  search = '';
  selectedBranch = '';
  selectedStatus = '';

  isLoading = false;
  isSaving = false;
  dialogOpen = false;
  editing = false;
  errorMessage = '';
  successMessage = '';

  readonly statuses: TableStatus[] = [
    'DISPONIBLE',
    'OCUPADA',
    'RESERVADA',
    'MANTENIMIENTO',
    'INACTIVA'
  ];

  form: TableForm = this.emptyForm();

  constructor(private readonly api: SaborAndinoApiService) {}

  ngOnInit(): void {
    this.loadBranches();
    this.loadTables();
  }

  get filteredTables(): RestaurantTableItem[] {
    const query = this.normalize(this.search);
    return this.tables.filter(item => {
      const matchesQuery = !query || [item.tableNumber, item.branch, item.location]
        .some(value => this.normalize(value).includes(query));
      const matchesBranch = !this.selectedBranch || item.idBranch === this.selectedBranch;
      const matchesStatus = !this.selectedStatus || item.status === this.selectedStatus;
      return matchesQuery && matchesBranch && matchesStatus;
    });
  }

  get activeCount(): number {
    return this.tables.filter(item => item.status !== 'INACTIVA').length;
  }

  get availableCount(): number {
    return this.tables.filter(item => item.status === 'DISPONIBLE').length;
  }

  openCreate(): void {
    this.editing = false;
    this.form = this.emptyForm();
    if (this.branches.length === 1) this.form.idBranch = this.branches[0].idBranch;
    this.clearMessages();
    this.dialogOpen = true;
  }

  openEdit(item: RestaurantTableItem): void {
    this.editing = true;
    this.form = {
      idRestaurantTable: item.idRestaurantTable,
      idBranch: item.idBranch,
      tableNumber: item.tableNumber,
      capacity: item.capacity,
      location: item.location,
      status: item.status
    };
    this.clearMessages();
    this.dialogOpen = true;
  }

  closeDialog(): void {
    if (this.isSaving) return;
    this.dialogOpen = false;
  }

  save(): void {
    this.clearMessages();
    if (!this.form.idBranch || !this.form.tableNumber.trim() || this.form.capacity < 1) {
      this.errorMessage = 'Completa la sucursal, el número de mesa y una capacidad válida.';
      return;
    }

    const branch = this.branches.find(item => item.idBranch === this.form.idBranch);
    if (!branch) {
      this.errorMessage = 'Selecciona una sucursal válida.';
      return;
    }

    const duplicated = this.tables.some(item =>
      item.idRestaurantTable !== this.form.idRestaurantTable &&
      item.idBranch === this.form.idBranch &&
      this.normalize(item.tableNumber) === this.normalize(this.form.tableNumber)
    );
    if (duplicated) {
      this.errorMessage = 'Ya existe una mesa con ese número en la sucursal seleccionada.';
      return;
    }

    const next: RestaurantTableItem = {
      id: this.form.idRestaurantTable
        ? (this.tables.find(item => item.idRestaurantTable === this.form.idRestaurantTable)?.id ?? this.tables.length + 1)
        : this.tables.length + 1,
      idRestaurantTable: this.form.idRestaurantTable,
      idBranch: this.form.idBranch,
      branchCode: branch.code,
      branch: branch.name,
      tableNumber: this.form.tableNumber.trim(),
      capacity: Number(this.form.capacity),
      location: this.form.location.trim() || 'Salón principal',
      status: this.form.status
    };

    const payload = this.form.idRestaurantTable
      ? this.tables.map(item => item.idRestaurantTable === this.form.idRestaurantTable ? next : item)
      : [...this.tables, next];

    this.isSaving = true;
    this.api.syncTables(payload).subscribe({
      next: response => {
        this.isSaving = false;
        if (!response.success) {
          this.errorMessage = response.message;
          return;
        }
        this.dialogOpen = false;
        this.successMessage = this.editing ? 'Mesa actualizada correctamente.' : 'Mesa registrada correctamente.';
        this.loadTables();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'No se pudo guardar la mesa en la base de datos.';
      }
    });
  }

  delete(item: RestaurantTableItem): void {
    if (!window.confirm(`¿Eliminar la mesa ${item.tableNumber} de ${item.branch}?`)) return;
    this.api.deleteTable(item.idRestaurantTable).subscribe({
      next: response => {
        if (!response.success) {
          window.alert(response.message);
          return;
        }
        this.successMessage = 'Mesa eliminada correctamente.';
        this.loadTables();
      },
      error: () => window.alert('No se pudo eliminar la mesa.')
    });
  }

  clearFilters(): void {
    this.search = '';
    this.selectedBranch = '';
    this.selectedStatus = '';
  }

  statusLabel(status: TableStatus): string {
    const labels: Record<TableStatus, string> = {
      DISPONIBLE: 'Disponible',
      OCUPADA: 'Ocupada',
      RESERVADA: 'Reservada',
      MANTENIMIENTO: 'Mantenimiento',
      INACTIVA: 'Inactiva'
    };
    return labels[status];
  }

  trackById(_index: number, item: RestaurantTableItem): string {
    return item.idRestaurantTable || `${item.idBranch}-${item.tableNumber}`;
  }

  private loadTables(): void {
    this.isLoading = true;
    this.api.getAdminTables<RestaurantTableItem[]>().subscribe({
      next: response => {
        this.isLoading = false;
        this.tables = response.success && Array.isArray(response.data) ? response.data : [];
      },
      error: () => {
        this.isLoading = false;
        this.tables = [];
        this.errorMessage = 'No se pudieron cargar las mesas desde la base de datos.';
      }
    });
  }

  private loadBranches(): void {
    this.api.getAdminBranches<Array<Record<string, unknown>>>().subscribe({
      next: response => {
        if (!response.success || !Array.isArray(response.data)) return;
        this.branches = response.data.map(item => ({
          idBranch: String(item['idBranch'] ?? ''),
          code: String(item['code'] ?? ''),
          name: String(item['name'] ?? '')
        })).filter(item => item.idBranch && item.name);
      }
    });
  }

  private emptyForm(): TableForm {
    return {
      idRestaurantTable: '',
      idBranch: '',
      tableNumber: '',
      capacity: 4,
      location: 'Salón principal',
      status: 'DISPONIBLE'
    };
  }

  private normalize(value: string): string {
    return value.trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
