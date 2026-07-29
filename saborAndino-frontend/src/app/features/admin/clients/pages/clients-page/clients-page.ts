import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaborAndinoApiService } from '../../../../../core/api/sabor-andino-api.service';

type ClientStatus =
  | 'Activo'
  | 'Inactivo'
  | 'Bloqueado';

type DocumentType =
  | 'DNI'
  | 'CE'
  | 'RUC';

interface ClientItem {
  id: number;
  code: string;
  names: string;
  surnames: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  email: string;
  department: string;
  province: string;
  district: string;
  address: string;
  registrationDate: string;
  lastOrderDate: string;
  orderCount: number;
  totalSpent: number;
  status: ClientStatus;
}

interface ClientForm {
  names: string;
  surnames: string;
  documentType: DocumentType;
  documentNumber: string;
  phone: string;
  email: string;
  department: string;
  province: string;
  district: string;
  address: string;
  registrationDate: string;
  status: ClientStatus;
}

@Component({
  selector: 'app-admin-clients-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './clients-page.html',
  styleUrl: './clients-page.css'
})
export class AdminClientsPage {

  searchTerm = '';
  selectedStatus = '';
  selectedDepartment = '';

  currentPage = 1;
  readonly pageSize = 8;

  isClientModalOpen = false;
  isClientDetailOpen = false;

  editingClientId: number | null = null;
  selectedClient: ClientItem | null = null;

  clients: ClientItem[] = [];

  clientForm: ClientForm =
    this.createEmptyClientForm();

  readonly statusOptions: ClientStatus[] = [
    'Activo',
    'Inactivo',
    'Bloqueado'
  ];

  readonly documentTypeOptions: DocumentType[] = [
    'DNI',
    'CE',
    'RUC'
  ];

  readonly departmentOptions: string[] = [
    'Lima',
    'Apurímac',
    'Ayacucho'
  ];

  constructor(private readonly api: SaborAndinoApiService) {
    this.loadClients();
  }

  get totalClients(): number {
    return this.clients.length;
  }

  get activeClients(): number {
    return this.clients.filter(
      client => client.status === 'Activo'
    ).length;
  }

  get newClientsThisMonth(): number {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    return this.clients.filter(client => {
      const registrationDate =
        new Date(`${client.registrationDate}T12:00:00`);

      return (
        registrationDate.getFullYear() === currentYear &&
        registrationDate.getMonth() === currentMonth
      );
    }).length;
  }

  get clientsWithOrders(): number {
    return this.clients.filter(
      client => client.orderCount > 0
    ).length;
  }

  get totalRevenue(): number {
    return this.clients.reduce(
      (total, client) =>
        total + Number(client.totalSpent),
      0
    );
  }

  get filteredClients(): ClientItem[] {
    const searchValue =
      this.searchTerm
        .trim()
        .toLowerCase();

    return this.clients.filter(client => {

      const fullName =
        this.getFullName(client)
          .toLowerCase();

      const matchesSearch =
        !searchValue ||
        client.code
          .toLowerCase()
          .includes(searchValue) ||
        fullName.includes(searchValue) ||
        client.documentNumber
          .toLowerCase()
          .includes(searchValue) ||
        client.phone
          .toLowerCase()
          .includes(searchValue) ||
        client.email
          .toLowerCase()
          .includes(searchValue);

      const matchesStatus =
        !this.selectedStatus ||
        client.status ===
          this.selectedStatus;

      const matchesDepartment =
        !this.selectedDepartment ||
        client.department ===
          this.selectedDepartment;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDepartment
      );
    });
  }

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(
        this.filteredClients.length /
        this.pageSize
      )
    );
  }

  get paginatedClients(): ClientItem[] {
    const startIndex =
      (this.currentPage - 1) *
      this.pageSize;

    const endIndex =
      startIndex + this.pageSize;

    return this.filteredClients.slice(
      startIndex,
      endIndex
    );
  }

  get showingFrom(): number {
    if (this.filteredClients.length === 0) {
      return 0;
    }

    return (
      (this.currentPage - 1) *
      this.pageSize
    ) + 1;
  }

  get showingTo(): number {
    return Math.min(
      this.currentPage * this.pageSize,
      this.filteredClients.length
    );
  }

  get isEditingClient(): boolean {
    return this.editingClientId !== null;
  }

  onFiltersChange(): void {
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedDepartment = '';
    this.currentPage = 1;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  openCreateClient(): void {
    this.editingClientId = null;

    this.clientForm =
      this.createEmptyClientForm();

    this.isClientModalOpen = true;
  }

  openEditClient(
    client: ClientItem
  ): void {
    this.editingClientId =
      client.id;

    this.clientForm = {
      names: client.names,
      surnames: client.surnames,
      documentType: client.documentType,
      documentNumber: client.documentNumber,
      phone: client.phone,
      email: client.email,
      department: client.department,
      province: client.province,
      district: client.district,
      address: client.address,
      registrationDate: client.registrationDate,
      status: client.status
    };

    this.isClientModalOpen = true;
  }

  closeClientModal(): void {
    this.isClientModalOpen = false;
    this.editingClientId = null;

    this.clientForm =
      this.createEmptyClientForm();
  }

  viewClient(
    client: ClientItem
  ): void {
    this.selectedClient = client;
    this.isClientDetailOpen = true;
  }

  closeClientDetail(): void {
    this.isClientDetailOpen = false;
    this.selectedClient = null;
  }

  saveClient(): void {
    const names =
      this.clientForm.names.trim();

    const surnames =
      this.clientForm.surnames.trim();

    const documentNumber =
      this.clientForm.documentNumber
        .trim();

    const phone =
      this.clientForm.phone.trim();

    const email =
      this.clientForm.email
        .trim()
        .toLowerCase();

    if (!names) {
      window.alert(
        'Ingresa los nombres del cliente.'
      );

      return;
    }

    if (!surnames) {
      window.alert(
        'Ingresa los apellidos del cliente.'
      );

      return;
    }

    if (!documentNumber) {
      window.alert(
        'Ingresa el número de documento.'
      );

      return;
    }

    if (!phone) {
      window.alert(
        'Ingresa el teléfono del cliente.'
      );

      return;
    }

    if (!email) {
      window.alert(
        'Ingresa el correo electrónico.'
      );

      return;
    }

    if (!this.isValidEmail(email)) {
      window.alert(
        'Ingresa un correo electrónico válido.'
      );

      return;
    }

    if (!this.clientForm.department) {
      window.alert(
        'Selecciona el departamento.'
      );

      return;
    }

    const documentExists =
      this.clients.some(
        client =>
          client.documentNumber
            .trim()
            .toLowerCase() ===
            documentNumber.toLowerCase() &&
          client.id !==
            this.editingClientId
      );

    if (documentExists) {
      window.alert(
        'Ya existe un cliente con ese documento.'
      );

      return;
    }

    const emailExists =
      this.clients.some(
        client =>
          client.email
            .trim()
            .toLowerCase() ===
            email &&
          client.id !==
            this.editingClientId
      );

    if (emailExists) {
      window.alert(
        'Ya existe un cliente con ese correo.'
      );

      return;
    }

    if (this.editingClientId !== null) {

      this.clients =
        this.clients.map(client => {

          if (
            client.id !==
            this.editingClientId
          ) {
            return client;
          }

          return {
            ...client,
            names,
            surnames,
            documentType:
              this.clientForm.documentType,
            documentNumber,
            phone,
            email,
            department:
              this.clientForm.department,
            province:
              this.clientForm.province.trim(),
            district:
              this.clientForm.district.trim(),
            address:
              this.clientForm.address.trim(),
            registrationDate:
              this.clientForm.registrationDate,
            status:
              this.clientForm.status
          };
        });

    } else {

      const nextId =
        this.clients.length > 0
          ? Math.max(
              ...this.clients.map(
                client => client.id
              )
            ) + 1
          : 1;

      const newClient: ClientItem = {
        id: nextId,

        code:
          `CLI-${String(nextId)
            .padStart(4, '0')}`,

        names,
        surnames,

        documentType:
          this.clientForm.documentType,

        documentNumber,
        phone,
        email,

        department:
          this.clientForm.department,

        province:
          this.clientForm.province.trim(),

        district:
          this.clientForm.district.trim(),

        address:
          this.clientForm.address.trim(),

        registrationDate:
          this.clientForm.registrationDate,

        lastOrderDate: '',
        orderCount: 0,
        totalSpent: 0,

        status:
          this.clientForm.status
      };

      this.clients = [
        newClient,
        ...this.clients
      ];
    }

    this.saveClients();
    this.currentPage = 1;
    this.closeClientModal();
  }

  toggleClientStatus(
    client: ClientItem
  ): void {
    this.clients =
      this.clients.map(
        currentClient => {

          if (
            currentClient.id !==
            client.id
          ) {
            return currentClient;
          }

          const nextStatus:
            ClientStatus =
              currentClient.status ===
              'Activo'
                ? 'Inactivo'
                : 'Activo';

          return {
            ...currentClient,
            status: nextStatus
          };
        }
      );

    this.saveClients();
  }

  blockClient(
    client: ClientItem
  ): void {
    this.clients =
      this.clients.map(
        currentClient => {

          if (
            currentClient.id !==
            client.id
          ) {
            return currentClient;
          }

          return {
            ...currentClient,
            status:
              currentClient.status ===
              'Bloqueado'
                ? 'Activo'
                : 'Bloqueado'
          };
        }
      );

    this.saveClients();
  }

  removeClient(client: ClientItem): void {
    if (client.orderCount > 0) {
      window.alert(`No se puede eliminar a ${this.getFullName(client)} porque tiene ${client.orderCount} pedidos registrados. Puedes desactivar su cuenta.`);
      return;
    }
    if (!window.confirm(`¿Deseas eliminar al cliente "${this.getFullName(client)}"?`)) return;

    this.api.deleteClient(client.code).subscribe({
      next: response => {
        if (!response.success) {
          window.alert(response.message);
          return;
        }
        this.clients = this.clients.filter(item => item.id !== client.id);
        this.currentPage = Math.min(this.currentPage, this.totalPages);
      },
      error: () => window.alert('No se pudo eliminar el cliente en el backend.')
    });
  }

  exportClients(): void {
    const headers = [
      'Código',
      'Nombres',
      'Apellidos',
      'Tipo de documento',
      'Número de documento',
      'Teléfono',
      'Correo',
      'Departamento',
      'Provincia',
      'Distrito',
      'Dirección',
      'Fecha de registro',
      'Último pedido',
      'Cantidad de pedidos',
      'Total gastado',
      'Estado'
    ];

    const rows =
      this.filteredClients.map(
        client => [
          client.code,
          client.names,
          client.surnames,
          client.documentType,
          client.documentNumber,
          client.phone,
          client.email,
          client.department,
          client.province,
          client.district,
          client.address,
          client.registrationDate,
          client.lastOrderDate,
          client.orderCount.toString(),
          client.totalSpent.toFixed(2),
          client.status
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
      'clientes-sabor-andino.csv';

    link.click();

    URL.revokeObjectURL(
      downloadUrl
    );
  }

  getFullName(
    client: ClientItem
  ): string {
    return `${client.names} ${client.surnames}`;
  }

  getInitials(
    client: ClientItem
  ): string {
    const firstName =
      client.names.trim().charAt(0);

    const firstSurname =
      client.surnames.trim().charAt(0);

    return `${firstName}${firstSurname}`
      .toUpperCase();
  }

  getStatusClass(
    status: ClientStatus
  ): string {
    const statusClasses:
      Record<ClientStatus, string> = {

      'Activo':
        'status-active',

      'Inactivo':
        'status-inactive',

      'Bloqueado':
        'status-blocked'
    };

    return statusClasses[status];
  }

  getLocationText(
    client: ClientItem
  ): string {
    const locationParts = [
      client.district,
      client.province,
      client.department
    ].filter(Boolean);

    return locationParts.length > 0
      ? locationParts.join(', ')
      : 'Ubicación por completar';
  }

  formatCurrency(
    amount: number
  ): string {
    return new Intl.NumberFormat(
      'es-PE',
      {
        style: 'currency',
        currency: 'PEN',
        minimumFractionDigits: 2
      }
    ).format(amount);
  }

  formatDate(
    dateValue: string
  ): string {
    if (!dateValue) {
      return 'Sin registro';
    }

    const date =
      new Date(`${dateValue}T12:00:00`);

    return new Intl.DateTimeFormat(
      'es-PE',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }
    ).format(date);
  }

  trackByClientId(
    index: number,
    client: ClientItem
  ): number {
    return client.id;
  }

  private loadClients(): void {
    this.api.getAdminClients<ClientItem[]>().subscribe({
      next: response => {
        this.clients = response.success && Array.isArray(response.data)
          ? response.data
          : [];
      },
      error: () => {
        this.clients = [];
        console.error('No se pudieron cargar los clientes desde la base de datos.');
      }
    });
  }


  private saveClients(): void {
    this.api.syncClients(this.clients).subscribe({
      next: response => {
        if (!response.success) {
          window.alert(response.message);
          return;
        }
        this.loadClients();
      },
      error: () => window.alert('No se pudieron guardar los clientes en la base de datos.')
    });
  }


  private isValidEmail(
    email: string
  ): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email);
  }

  private getTodayIso(): string {
    const date = new Date();

    const year =
      date.getFullYear();

    const month =
      String(
        date.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        date.getDate()
      ).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private createEmptyClientForm():
    ClientForm {

    return {
      names: '',
      surnames: '',
      documentType: 'DNI',
      documentNumber: '',
      phone: '',
      email: '',
      department: '',
      province: '',
      district: '',
      address: '',
      registrationDate:
        this.getTodayIso(),
      status: 'Activo'
    };
  }


}