import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaborAndinoApiService } from '../../../../../core/api/sabor-andino-api.service';

type BranchStatus =
  | 'Activa'
  | 'Inactiva'
  | 'En mantenimiento';

interface BranchItem {
  id: number;
  code: string;
  name: string;
  department: string;
  province: string;
  district: string;
  address: string;
  reference: string;
  phone: string;
  email: string;
  openingTime: string;
  closingTime: string;
  manager: string;
  tableCount: number;
  capacity: number;
  status: BranchStatus;
  mapsUrl: string;
  imageUrl: string;
}

interface BranchForm {
  name: string;
  department: string;
  province: string;
  district: string;
  address: string;
  reference: string;
  phone: string;
  email: string;
  openingTime: string;
  closingTime: string;
  manager: string;
  tableCount: number;
  capacity: number;
  status: BranchStatus;
  mapsUrl: string;
  imageUrl: string;
}

@Component({
  selector: 'app-admin-branches-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './branches-page.html',
  styleUrl: './branches-page.css'
})
export class AdminBranchesPage {

  searchTerm = '';
  selectedDepartment = '';
  selectedStatus = '';

  currentPage = 1;
  readonly pageSize = 6;

  isBranchModalOpen = false;
  editingBranchId: number | null = null;

  branches: BranchItem[] = [];

  branchForm: BranchForm =
    this.createEmptyBranchForm();

  readonly departmentOptions: string[] = [
    'Lima',
    'Apurímac',
    'Ayacucho'
  ];

  readonly statusOptions: BranchStatus[] = [
    'Activa',
    'Inactiva',
    'En mantenimiento'
  ];

  constructor(private readonly api: SaborAndinoApiService) {
    this.loadBranches();
  }

  get totalBranches(): number {
    return this.branches.length;
  }

  get activeBranches(): number {
    return this.branches.filter(
      branch => branch.status === 'Activa'
    ).length;
  }

  get maintenanceBranches(): number {
    return this.branches.filter(
      branch =>
        branch.status === 'En mantenimiento'
    ).length;
  }

  get totalCapacity(): number {
    return this.branches.reduce(
      (total, branch) =>
        total + Number(branch.capacity),
      0
    );
  }

  get totalTables(): number {
    return this.branches.reduce(
      (total, branch) =>
        total + Number(branch.tableCount),
      0
    );
  }

  get filteredBranches(): BranchItem[] {
    const searchValue =
      this.searchTerm
        .trim()
        .toLowerCase();

    return this.branches.filter(branch => {

      const matchesSearch =
        !searchValue ||
        branch.code
          .toLowerCase()
          .includes(searchValue) ||
        branch.name
          .toLowerCase()
          .includes(searchValue) ||
        branch.department
          .toLowerCase()
          .includes(searchValue) ||
        branch.province
          .toLowerCase()
          .includes(searchValue) ||
        branch.district
          .toLowerCase()
          .includes(searchValue) ||
        branch.address
          .toLowerCase()
          .includes(searchValue) ||
        branch.manager
          .toLowerCase()
          .includes(searchValue);

      const matchesDepartment =
        !this.selectedDepartment ||
        branch.department ===
          this.selectedDepartment;

      const matchesStatus =
        !this.selectedStatus ||
        branch.status ===
          this.selectedStatus;

      return (
        matchesSearch &&
        matchesDepartment &&
        matchesStatus
      );
    });
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(
        this.filteredBranches.length /
        this.pageSize
      )
    );
  }

  get paginatedBranches(): BranchItem[] {
    const startIndex =
      (this.currentPage - 1) *
      this.pageSize;

    const endIndex =
      startIndex + this.pageSize;

    return this.filteredBranches.slice(
      startIndex,
      endIndex
    );
  }

  get showingFrom(): number {
    if (
      this.filteredBranches.length === 0
    ) {
      return 0;
    }

    return (
      (this.currentPage - 1) *
      this.pageSize
    ) + 1;
  }

  get showingTo(): number {
    return Math.min(
      this.currentPage *
      this.pageSize,
      this.filteredBranches.length
    );
  }

  get isEditingBranch(): boolean {
    return this.editingBranchId !== null;
  }

  onFiltersChange(): void {
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedDepartment = '';
    this.selectedStatus = '';
    this.currentPage = 1;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (
      this.currentPage <
      this.totalPages
    ) {
      this.currentPage++;
    }
  }

  openCreateBranch(): void {
    this.editingBranchId = null;

    this.branchForm =
      this.createEmptyBranchForm();

    this.isBranchModalOpen = true;
  }

  openEditBranch(
    branch: BranchItem
  ): void {
    this.editingBranchId =
      branch.id;

    this.branchForm = {
      name: branch.name,
      department: branch.department,
      province: branch.province,
      district: branch.district,
      address: branch.address,
      reference: branch.reference,
      phone: branch.phone,
      email: branch.email,
      openingTime: branch.openingTime,
      closingTime: branch.closingTime,
      manager: branch.manager,
      tableCount: branch.tableCount,
      capacity: branch.capacity,
      status: branch.status,
      mapsUrl: branch.mapsUrl,
      imageUrl: branch.imageUrl
    };

    this.isBranchModalOpen = true;
  }

  closeBranchModal(): void {
    this.isBranchModalOpen = false;
    this.editingBranchId = null;

    this.branchForm =
      this.createEmptyBranchForm();
  }

  saveBranch(): void {
    const branchName =
      this.branchForm.name.trim();

    const department =
      this.branchForm.department.trim();

    const province =
      this.branchForm.province.trim();

    const district =
      this.branchForm.district.trim();

    const address =
      this.branchForm.address.trim();

    if (!branchName) {
      window.alert(
        'Ingresa el nombre de la sucursal.'
      );

      return;
    }

    if (!department) {
      window.alert(
        'Selecciona el departamento.'
      );

      return;
    }

    if (!province) {
      window.alert(
        'Ingresa la provincia.'
      );

      return;
    }

    if (!district) {
      window.alert(
        'Ingresa el distrito.'
      );

      return;
    }

    if (!address) {
      window.alert(
        'Ingresa la dirección de la sucursal.'
      );

      return;
    }

    if (
      Number(this.branchForm.tableCount) < 0 ||
      Number(this.branchForm.capacity) < 0
    ) {
      window.alert(
        'La cantidad de mesas y la capacidad no pueden ser negativas.'
      );

      return;
    }

    if (
      this.branchForm.openingTime &&
      this.branchForm.closingTime &&
      this.branchForm.openingTime ===
        this.branchForm.closingTime
    ) {
      window.alert(
        'La hora de apertura y cierre no pueden ser iguales.'
      );

      return;
    }

    const branchExists =
      this.branches.some(
        branch =>
          branch.name
            .trim()
            .toLowerCase() ===
            branchName.toLowerCase() &&
          branch.id !==
            this.editingBranchId
      );

    if (branchExists) {
      window.alert(
        'Ya existe una sucursal con ese nombre.'
      );

      return;
    }

    if (
      this.editingBranchId !== null
    ) {
      this.branches =
        this.branches.map(branch => {

          if (
            branch.id !==
            this.editingBranchId
          ) {
            return branch;
          }

          return {
            ...branch,
            name: branchName,
            department,
            province,
            district,
            address,
            reference:
              this.branchForm.reference.trim(),
            phone:
              this.branchForm.phone.trim(),
            email:
              this.branchForm.email.trim(),
            openingTime:
              this.branchForm.openingTime,
            closingTime:
              this.branchForm.closingTime,
            manager:
              this.branchForm.manager.trim(),
            tableCount:
              Number(
                this.branchForm.tableCount
              ),
            capacity:
              Number(
                this.branchForm.capacity
              ),
            status:
              this.branchForm.status,
            mapsUrl:
              this.branchForm.mapsUrl.trim(),
            imageUrl:
              this.branchForm.imageUrl
          };
        });

    } else {
      const nextId =
        this.branches.length > 0
          ? Math.max(
              ...this.branches.map(
                branch => branch.id
              )
            ) + 1
          : 1;

      const newBranch: BranchItem = {
        id: nextId,

        code:
          `SUC-${String(nextId)
            .padStart(3, '0')}`,

        name: branchName,
        department,
        province,
        district,
        address,

        reference:
          this.branchForm.reference.trim(),

        phone:
          this.branchForm.phone.trim(),

        email:
          this.branchForm.email.trim(),

        openingTime:
          this.branchForm.openingTime,

        closingTime:
          this.branchForm.closingTime,

        manager:
          this.branchForm.manager.trim(),

        tableCount:
          Number(
            this.branchForm.tableCount
          ),

        capacity:
          Number(
            this.branchForm.capacity
          ),

        status:
          this.branchForm.status,

        mapsUrl:
          this.branchForm.mapsUrl.trim(),

        imageUrl:
          this.branchForm.imageUrl
      };

      this.branches = [
        newBranch,
        ...this.branches
      ];
    }

    this.saveBranches();
    this.currentPage = 1;
    this.closeBranchModal();
  }

  toggleBranchStatus(
    branch: BranchItem
  ): void {
    this.branches =
      this.branches.map(
        currentBranch => {

          if (
            currentBranch.id !==
            branch.id
          ) {
            return currentBranch;
          }

          const nextStatus:
            BranchStatus =
              currentBranch.status ===
              'Activa'
                ? 'Inactiva'
                : 'Activa';

          return {
            ...currentBranch,
            status: nextStatus
          };
        }
      );

    this.saveBranches();
  }

  setMaintenance(
    branch: BranchItem
  ): void {
    this.branches =
      this.branches.map(
        currentBranch => {

          if (
            currentBranch.id !==
            branch.id
          ) {
            return currentBranch;
          }

          return {
            ...currentBranch,
            status:
              currentBranch.status ===
              'En mantenimiento'
                ? 'Activa'
                : 'En mantenimiento'
          };
        }
      );

    this.saveBranches();
  }

  removeBranch(branch: BranchItem): void {
    if (!window.confirm(`¿Deseas eliminar la sucursal "${branch.name}"?`)) return;

    this.api.deleteBranch(branch.code).subscribe({
      next: response => {
        if (!response.success) {
          window.alert(response.message);
          return;
        }
        this.branches = this.branches.filter(item => item.id !== branch.id);
        this.currentPage = Math.min(this.currentPage, this.totalPages);
      },
      error: () => window.alert('No se pudo eliminar la sucursal en el backend.')
    });
  }

  openMap(
    branch: BranchItem
  ): void {
    const mapsUrl =
      branch.mapsUrl.trim();

    if (!mapsUrl) {
      window.alert(
        'Esta sucursal todavía no tiene un enlace de Google Maps registrado.'
      );

      return;
    }

    const safeUrl =
      this.normalizeExternalUrl(
        mapsUrl
      );

    window.open(
      safeUrl,
      '_blank',
      'noopener,noreferrer'
    );
  }

  onImageSelected(
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    const file =
      input.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith('image/')
    ) {
      window.alert(
        'Selecciona una imagen válida.'
      );

      input.value = '';
      return;
    }

    const maximumSize =
      2 * 1024 * 1024;

    if (file.size > maximumSize) {
      window.alert(
        'La imagen no debe superar los 2 MB.'
      );

      input.value = '';
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      this.branchForm.imageUrl =
        typeof reader.result ===
        'string'
          ? reader.result
          : '';
    };

    reader.readAsDataURL(file);
  }

  removeSelectedImage(): void {
    this.branchForm.imageUrl = '';
  }

  onBranchImageError(
    branch: BranchItem
  ): void {
    branch.imageUrl = '';
    this.saveBranches();
  }

  exportBranches(): void {
    const headers = [
      'Código',
      'Sucursal',
      'Departamento',
      'Provincia',
      'Distrito',
      'Dirección',
      'Referencia',
      'Teléfono',
      'Correo',
      'Horario de apertura',
      'Horario de cierre',
      'Responsable',
      'Mesas',
      'Capacidad',
      'Estado',
      'Google Maps'
    ];

    const rows =
      this.filteredBranches.map(
        branch => [
          branch.code,
          branch.name,
          branch.department,
          branch.province,
          branch.district,
          branch.address,
          branch.reference,
          branch.phone,
          branch.email,
          branch.openingTime,
          branch.closingTime,
          branch.manager,
          branch.tableCount.toString(),
          branch.capacity.toString(),
          branch.status,
          branch.mapsUrl
        ]
      );

    const csvContent = [
      headers,
      ...rows
    ]
      .map(row =>
        row
          .map(value =>
            `"${value.replace(
              /"/g,
              '""'
            )}"`
          )
          .join(',')
      )
      .join('\n');

    const file = new Blob(
      [
        '\uFEFF',
        csvContent
      ],
      {
        type:
          'text/csv;charset=utf-8;'
      }
    );

    const downloadUrl =
      URL.createObjectURL(file);

    const link =
      document.createElement('a');

    link.href = downloadUrl;

    link.download =
      'sucursales-sabor-andino.csv';

    link.click();

    URL.revokeObjectURL(
      downloadUrl
    );
  }

  getStatusClass(
    status: BranchStatus
  ): string {
    const statusClasses:
      Record<BranchStatus, string> = {

      'Activa':
        'status-active',

      'Inactiva':
        'status-inactive',

      'En mantenimiento':
        'status-maintenance'
    };

    return statusClasses[status];
  }

  getLocationText(
    branch: BranchItem
  ): string {
    const locationParts = [
      branch.district,
      branch.province,
      branch.department
    ].filter(Boolean);

    return locationParts.length > 0
      ? locationParts.join(', ')
      : 'Ubicación por completar';
  }

  getAddressText(
    branch: BranchItem
  ): string {
    return branch.address.trim() ||
      'Dirección por completar';
  }

  getManagerText(
    branch: BranchItem
  ): string {
    return branch.manager.trim() ||
      'Responsable por asignar';
  }

  getPhoneText(
    branch: BranchItem
  ): string {
    return branch.phone.trim() ||
      'Teléfono por registrar';
  }

  getScheduleText(
    branch: BranchItem
  ): string {
    if (
      !branch.openingTime ||
      !branch.closingTime
    ) {
      return 'Horario por registrar';
    }

    return `${branch.openingTime} - ${branch.closingTime}`;
  }

  trackByBranchId(
    index: number,
    branch: BranchItem
  ): number {
    return branch.id;
  }

  private loadBranches(): void {
    this.api.getAdminBranches<BranchItem[]>().subscribe({
      next: response => {
        this.branches = response.success && Array.isArray(response.data)
          ? response.data
          : [];
      },
      error: () => {
        this.branches = [];
        console.error('No se pudieron cargar las sucursales desde la base de datos.');
      }
    });
  }


  private saveBranches(): void {
    this.api.syncBranches(this.branches).subscribe({
      next: response => {
        if (!response.success) {
          console.error(response.message);
          return;
        }
        this.loadBranches();
      },
      error: () => console.error('No se pudieron guardar las sucursales en la base de datos.')
    });
  }


  private normalizeExternalUrl(
    value: string
  ): string {
    if (
      value.startsWith('http://') ||
      value.startsWith('https://')
    ) {
      return value;
    }

    return `https://${value}`;
  }

  private createEmptyBranchForm():
    BranchForm {

    return {
      name: '',
      department: '',
      province: '',
      district: '',
      address: '',
      reference: '',
      phone: '',
      email: '',
      openingTime: '09:00',
      closingTime: '22:00',
      manager: '',
      tableCount: 0,
      capacity: 0,
      status: 'Activa',
      mapsUrl: '',
      imageUrl: ''
    };
  }


}