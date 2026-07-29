import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaborAndinoApiService } from '../../../../../core/api/sabor-andino-api.service';

/* =========================================================
   TIPOS
========================================================= */

type ReservationStatus =
  | 'Pendiente'
  | 'Confirmada'
  | 'Reprogramada'
  | 'Atendida'
  | 'Cancelada';

type ReservationStatusFilter =
  | ''
  | ReservationStatus;

type ToastType =
  | 'success'
  | 'error'
  | 'info';

/* =========================================================
   INTERFACES
========================================================= */

interface ReservationItem {
  code: string;

  customerName: string;
  customerPhone: string;
  customerInitial: string;

  branch: string;

  date: string;
  dateLabel: string;
  time: string;

  guests: number;
  occasion: string;
  table: string;

  status: ReservationStatus;

  notes: string;

  createdAt: string;
  updatedAt: string;

  cancellationReason?: string;
}

interface ReservationForm {
  customerName: string;
  customerPhone: string;

  branch: string;

  date: string;
  time: string;

  guests: number;
  occasion: string;
  table: string;

  notes: string;
}

/* =========================================================
   COMPONENTE
========================================================= */

@Component({
  selector: 'app-admin-reservations-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './reservations-page.html',
  styleUrl: './reservations-page.css'
})
export class AdminReservationsPage
implements OnInit, OnDestroy {

  /* =======================================================
     FILTROS
  ======================================================== */

  searchTerm = '';

  selectedStatus:
    ReservationStatusFilter = '';

  selectedBranch = '';
  selectedDate = '';

  /* =======================================================
     PAGINACIÓN
  ======================================================== */

  currentPage = 1;

  readonly pageSize = 8;

  /* =======================================================
     OPCIONES
  ======================================================== */

  readonly statusOptions:
    ReservationStatus[] = [
      'Pendiente',
      'Confirmada',
      'Reprogramada',
      'Atendida',
      'Cancelada'
    ];

  branchOptions: string[] = [];

  /* =======================================================
     MODALES
  ======================================================== */

  detailsModalOpen = false;

  editReservationModalOpen = false;

  registerReservationModalOpen = false;

  cancellationModalOpen = false;

  selectedReservation:
    ReservationItem | null = null;

  editingReservation:
    ReservationItem | null = null;

  reservationPendingCancellation:
    ReservationItem | null = null;

  /* =======================================================
     ESTADOS DE FORMULARIOS
  ======================================================== */

  editReservationError = '';
  newReservationError = '';
  cancellationError = '';

  cancellationReason = '';

  isUpdatingReservation = false;
  isRegisteringReservation = false;
  isCancellingReservation = false;

  private reopenDetailsAfterEdit = false;

  private reopenDetailsAfterCancellation =
    false;

  private editingReservationCode:
    string | null = null;

  private cancellationReservationCode:
    string | null = null;

  /* =======================================================
     NOTIFICACIONES
  ======================================================== */

  toastVisible = false;
  toastMessage = '';

  toastType:
    ToastType = 'info';

  private toastTimer:
    ReturnType<typeof setTimeout> | null =
      null;

  /* =======================================================
     ALMACENAMIENTO
  ======================================================== */

  private readonly reservationsStorageKey =
    'sabor-andino-admin-reservations';

  /* =======================================================
     FORMULARIO DE NUEVA RESERVA
  ======================================================== */

  newReservation:
    ReservationForm =
      this.createEmptyReservationForm();

  /* =======================================================
     RESERVAS
  ======================================================== */

  reservations:
    ReservationItem[] = [];

  /* =======================================================
     CICLO DE VIDA
  ======================================================== */

  constructor(private readonly api: SaborAndinoApiService) {}

  ngOnInit(): void {
    this.loadReservations();
    this.loadBranchOptions();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(
        this.toastTimer
      );

      this.toastTimer = null;
    }
  }

  /* =======================================================
     INDICADORES
  ======================================================== */

  get totalReservations(): number {
    return this.reservations.length;
  }

  get confirmedReservations(): number {
    return this.reservations.filter(
      reservation =>
        reservation.status ===
        'Confirmada'
    ).length;
  }

  get pendingReservations(): number {
    return this.reservations.filter(
      reservation =>
        reservation.status ===
        'Pendiente'
    ).length;
  }

  get cancelledReservations(): number {
    return this.reservations.filter(
      reservation =>
        reservation.status ===
        'Cancelada'
    ).length;
  }

  get attendedReservations(): number {
    return this.reservations.filter(
      reservation =>
        reservation.status ===
        'Atendida'
    ).length;
  }

  get rescheduledReservations(): number {
    return this.reservations.filter(
      reservation =>
        reservation.status ===
        'Reprogramada'
    ).length;
  }

  /* =======================================================
     FILTRADO
  ======================================================== */

  get filteredReservations():
    ReservationItem[] {

    const searchValue =
      this.normalizeText(
        this.searchTerm
      );

    return this.reservations.filter(
      reservation => {

        const searchableContent =
          this.normalizeText(
            [
              reservation.code,
              reservation.customerName,
              reservation.customerPhone,
              reservation.branch,
              reservation.occasion,
              reservation.table,
              reservation.status,
              reservation.dateLabel,
              reservation.time
            ].join(' ')
          );

        const matchesSearch =
          !searchValue ||
          searchableContent.includes(
            searchValue
          );

        const matchesStatus =
          !this.selectedStatus ||
          reservation.status ===
            this.selectedStatus;

        const matchesBranch =
          !this.selectedBranch ||
          reservation.branch ===
            this.selectedBranch;

        const matchesDate =
          !this.selectedDate ||
          reservation.date ===
            this.selectedDate;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesBranch &&
          matchesDate
        );
      }
    );
  }

  /* =======================================================
     PAGINACIÓN
  ======================================================== */

  get totalPages(): number {
    return Math.max(
      1,
      Math.ceil(
        this.filteredReservations.length /
        this.pageSize
      )
    );
  }

  get paginatedReservations():
    ReservationItem[] {

    const safeCurrentPage =
      Math.min(
        this.currentPage,
        this.totalPages
      );

    const startIndex =
      (
        safeCurrentPage - 1
      ) *
      this.pageSize;

    return this.filteredReservations.slice(
      startIndex,
      startIndex +
      this.pageSize
    );
  }

  get showingFrom(): number {
    if (
      this.filteredReservations.length ===
      0
    ) {
      return 0;
    }

    const safeCurrentPage =
      Math.min(
        this.currentPage,
        this.totalPages
      );

    return (
      (
        safeCurrentPage - 1
      ) *
      this.pageSize
    ) + 1;
  }

  get showingTo(): number {
    return Math.min(
      this.showingFrom +
      this.pageSize -
      1,
      this.filteredReservations.length
    );
  }

  get pageNumbers(): number[] {
    return Array.from(
      {
        length:
          this.totalPages
      },
      (
        _,
        index
      ) =>
        index + 1
    );
  }

  previousPage(): void {
    if (
      this.currentPage > 1
    ) {
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

  goToPage(
    page: number
  ): void {

    if (
      page < 1 ||
      page > this.totalPages
    ) {
      return;
    }

    this.currentPage =
      page;
  }

  /* =======================================================
     FILTROS
  ======================================================== */

  onFiltersChange(): void {
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';

    this.selectedStatus = '';
    this.selectedBranch = '';
    this.selectedDate = '';

    this.currentPage = 1;
  }

  /* =======================================================
     DETALLE DE RESERVA
  ======================================================== */

  viewReservation(
    reservation: ReservationItem
  ): void {

    const currentReservation =
      this.findReservationByCode(
        reservation.code
      );

    if (!currentReservation) {
      this.showToast(
        'No se encontró la reserva seleccionada.',
        'error'
      );

      return;
    }

    this.selectedReservation =
      currentReservation;

    this.detailsModalOpen =
      true;
  }

  closeReservationDetails(): void {
    this.detailsModalOpen =
      false;

    this.selectedReservation =
      null;
  }

  /* =======================================================
     CONFIRMAR RESERVA
  ======================================================== */

  canConfirmReservation(
    reservation: ReservationItem
  ): boolean {

    return [
      'Pendiente',
      'Reprogramada'
    ].includes(
      reservation.status
    );
  }

  confirmReservation(
    reservation: ReservationItem
  ): void {

    if (
      !this.canConfirmReservation(
        reservation
      )
    ) {
      this.showToast(
        'Esta reserva ya no puede confirmarse.',
        'info'
      );

      return;
    }

    if (
      typeof window !==
      'undefined'
    ) {
      const confirmed =
        window.confirm(
          `¿Confirmas la reserva ${reservation.code}?`
        );

      if (!confirmed) {
        return;
      }
    }

    const updatedReservation:
      ReservationItem = {

      ...reservation,

      status:
        'Confirmada',

      updatedAt:
        this.formatCurrentDateTime(),

      cancellationReason:
        undefined
    };

    this.replaceReservation(
      updatedReservation
    );

    this.showToast(
      `${reservation.code} fue confirmada correctamente.`,
      'success'
    );
  }

  /* =======================================================
     EDITAR RESERVA
  ======================================================== */

  editReservation(
    reservation: ReservationItem
  ): void {

    const currentReservation =
      this.findReservationByCode(
        reservation.code
      );

    if (!currentReservation) {
      this.showToast(
        'No se encontró la reserva que deseas editar.',
        'error'
      );

      return;
    }

    this.reopenDetailsAfterEdit =
      this.detailsModalOpen &&
      this.selectedReservation?.code ===
        reservation.code;

    this.editingReservationCode =
      reservation.code;

    this.editingReservation =
      this.cloneReservation(
        currentReservation
      );

    this.editReservationError = '';

    this.editReservationModalOpen =
      true;

    this.detailsModalOpen =
      false;

    this.selectedReservation =
      null;
  }

  closeEditReservationModal(): void {
    if (
      this.isUpdatingReservation
    ) {
      return;
    }

    const shouldReopenDetails =
      this.reopenDetailsAfterEdit;

    const reservationCode =
      this.editingReservationCode;

    this.editReservationModalOpen =
      false;

    this.editingReservation =
      null;

    this.editReservationError = '';

    this.reopenDetailsAfterEdit =
      false;

    this.editingReservationCode =
      null;

    if (
      shouldReopenDetails &&
      reservationCode
    ) {
      const currentReservation =
        this.findReservationByCode(
          reservationCode
        );

      if (currentReservation) {
        this.selectedReservation =
          currentReservation;

        this.detailsModalOpen =
          true;
      }
    }
  }

  saveEditedReservation(): void {
    if (
      this.isUpdatingReservation ||
      !this.editingReservation
    ) {
      return;
    }

    const validationError =
      this.validateReservation(
        this.editingReservation
      );

    if (validationError) {
      this.editReservationError =
        validationError;

      return;
    }

    const reservationIndex =
      this.reservations.findIndex(
        reservation =>
          reservation.code ===
          this.editingReservation?.code
      );

    if (
      reservationIndex < 0
    ) {
      this.editReservationError =
        'No se encontró la reserva que deseas editar.';

      return;
    }

    this.isUpdatingReservation =
      true;

    const originalReservation =
      this.reservations[
        reservationIndex
      ];

    const customerName =
      this.editingReservation
        .customerName
        .trim();

    const date =
      this.editingReservation.date;

    const updatedReservation:
      ReservationItem = {

      ...originalReservation,

      customerName,

      customerPhone:
        this.editingReservation
          .customerPhone
          .trim(),

      customerInitial:
        customerName
          .charAt(0)
          .toUpperCase(),

      branch:
        this.editingReservation.branch,

      date,

      dateLabel:
        this.formatDateLabel(
          date
        ),

      time:
        this.editingReservation.time,

      guests:
        Number(
          this.editingReservation.guests
        ),

      occasion:
        this.editingReservation
          .occasion
          .trim(),

      table:
        this.editingReservation
          .table
          .trim(),

      notes:
        this.editingReservation
          .notes
          .trim(),

      updatedAt:
        this.formatCurrentDateTime()
    };

    this.replaceReservation(
      updatedReservation
    );

    const shouldReopenDetails =
      this.reopenDetailsAfterEdit;

    this.isUpdatingReservation =
      false;

    this.editReservationModalOpen =
      false;

    this.editingReservation =
      null;

    this.editReservationError = '';

    this.reopenDetailsAfterEdit =
      false;

    this.editingReservationCode =
      null;

    if (
      shouldReopenDetails
    ) {
      this.selectedReservation =
        updatedReservation;

      this.detailsModalOpen =
        true;
    }

    this.showToast(
      `${updatedReservation.code} fue actualizada correctamente.`,
      'success'
    );
  }

  /* =======================================================
     REGISTRAR RESERVA
  ======================================================== */

  registerReservation(): void {
    this.newReservation =
      this.createEmptyReservationForm();

    this.newReservationError = '';

    this.registerReservationModalOpen =
      true;
  }

  closeRegisterReservationModal(): void {
    if (
      this.isRegisteringReservation
    ) {
      return;
    }

    this.registerReservationModalOpen =
      false;

    this.newReservationError = '';
  }

  saveNewReservation(): void {
    if (
      this.isRegisteringReservation
    ) {
      return;
    }

    const validationError =
      this.validateReservationForm(
        this.newReservation
      );

    if (validationError) {
      this.newReservationError =
        validationError;

      return;
    }

    this.isRegisteringReservation =
      true;

    const customerName =
      this.newReservation
        .customerName
        .trim();

    const currentDateTime =
      this.formatCurrentDateTime();

    const reservation:
      ReservationItem = {

      code:
        this.generateNextReservationCode(),

      customerName,

      customerPhone:
        this.newReservation
          .customerPhone
          .trim(),

      customerInitial:
        customerName
          .charAt(0)
          .toUpperCase(),

      branch:
        this.newReservation.branch,

      date:
        this.newReservation.date,

      dateLabel:
        this.formatDateLabel(
          this.newReservation.date
        ),

      time:
        this.newReservation.time,

      guests:
        Number(
          this.newReservation.guests
        ),

      occasion:
        this.newReservation
          .occasion
          .trim(),

      table:
        this.newReservation
          .table
          .trim(),

      status:
        'Pendiente',

      notes:
        this.newReservation
          .notes
          .trim(),

      createdAt:
        currentDateTime,

      updatedAt:
        currentDateTime
    };

    this.reservations = [
      reservation,
      ...this.reservations
    ];

    this.saveReservations();

    this.isRegisteringReservation =
      false;

    this.registerReservationModalOpen =
      false;

    this.newReservation =
      this.createEmptyReservationForm();

    this.currentPage = 1;

    this.showToast(
      `${reservation.code} fue registrada correctamente.`,
      'success'
    );
  }

  /* =======================================================
     CANCELAR RESERVA
  ======================================================== */

  canCancelReservation(
    reservation: ReservationItem
  ): boolean {

    return ![
      'Atendida',
      'Cancelada'
    ].includes(
      reservation.status
    );
  }

  openCancellationModal(
    reservation: ReservationItem
  ): void {

    if (
      !this.canCancelReservation(
        reservation
      )
    ) {
      this.showToast(
        'Esta reserva ya no puede cancelarse.',
        'info'
      );

      return;
    }

    const currentReservation =
      this.findReservationByCode(
        reservation.code
      );

    if (!currentReservation) {
      this.showToast(
        'No se encontró la reserva que deseas cancelar.',
        'error'
      );

      return;
    }

    this.reopenDetailsAfterCancellation =
      this.detailsModalOpen &&
      this.selectedReservation?.code ===
        reservation.code;

    this.cancellationReservationCode =
      reservation.code;

    this.reservationPendingCancellation =
      currentReservation;

    this.cancellationReason = '';
    this.cancellationError = '';

    this.cancellationModalOpen =
      true;

    this.detailsModalOpen =
      false;

    this.selectedReservation =
      null;
  }

  closeCancellationModal(): void {
    if (
      this.isCancellingReservation
    ) {
      return;
    }

    const shouldReopenDetails =
      this.reopenDetailsAfterCancellation;

    const reservationCode =
      this.cancellationReservationCode;

    this.cancellationModalOpen =
      false;

    this.reservationPendingCancellation =
      null;

    this.cancellationReason = '';
    this.cancellationError = '';

    this.reopenDetailsAfterCancellation =
      false;

    this.cancellationReservationCode =
      null;

    if (
      shouldReopenDetails &&
      reservationCode
    ) {
      const currentReservation =
        this.findReservationByCode(
          reservationCode
        );

      if (currentReservation) {
        this.selectedReservation =
          currentReservation;

        this.detailsModalOpen =
          true;
      }
    }
  }

  confirmCancellation(): void {
    if (
      this.isCancellingReservation
    ) {
      return;
    }

    const reservation =
      this.reservationPendingCancellation;

    if (!reservation) {
      this.cancellationError =
        'No se encontró la reserva que deseas cancelar.';

      return;
    }

    const reason =
      this.cancellationReason
        .trim();

    if (
      reason.length < 5
    ) {
      this.cancellationError =
        'Ingresa un motivo de cancelación de al menos 5 caracteres.';

      return;
    }

    if (
      !this.canCancelReservation(
        reservation
      )
    ) {
      this.cancellationError =
        'Esta reserva ya no puede cancelarse.';

      return;
    }

    this.isCancellingReservation =
      true;

    const updatedReservation:
      ReservationItem = {

      ...reservation,

      status:
        'Cancelada',

      cancellationReason:
        reason,

      updatedAt:
        this.formatCurrentDateTime()
    };

    this.replaceReservation(
      updatedReservation
    );

    const shouldReopenDetails =
      this.reopenDetailsAfterCancellation;

    this.isCancellingReservation =
      false;

    this.cancellationModalOpen =
      false;

    this.reservationPendingCancellation =
      null;

    this.cancellationReason = '';
    this.cancellationError = '';

    this.reopenDetailsAfterCancellation =
      false;

    this.cancellationReservationCode =
      null;

    if (
      shouldReopenDetails
    ) {
      this.selectedReservation =
        updatedReservation;

      this.detailsModalOpen =
        true;
    }

    this.showToast(
      `${updatedReservation.code} fue cancelada correctamente.`,
      'success'
    );
  }

  /* =======================================================
     CAMBIO DE ESTADO
  ======================================================== */

  markReservationAsAttended(
    reservation: ReservationItem
  ): void {

    if (
      reservation.status !==
      'Confirmada'
    ) {
      this.showToast(
        'Solo las reservas confirmadas pueden marcarse como atendidas.',
        'info'
      );

      return;
    }

    const updatedReservation:
      ReservationItem = {

      ...reservation,

      status:
        'Atendida',

      updatedAt:
        this.formatCurrentDateTime()
    };

    this.replaceReservation(
      updatedReservation
    );

    this.showToast(
      `${reservation.code} fue marcada como atendida.`,
      'success'
    );
  }

  /* =======================================================
     EXPORTAR
  ======================================================== */

  exportReservations(): void {
    if (
      this.filteredReservations.length ===
      0
    ) {
      this.showToast(
        'No existen reservas para exportar.',
        'info'
      );

      return;
    }

    if (
      typeof document ===
      'undefined'
    ) {
      return;
    }

    const headers = [
      'Código',
      'Cliente',
      'Teléfono',
      'Sucursal',
      'Fecha',
      'Hora',
      'Personas',
      'Motivo',
      'Mesa',
      'Estado',
      'Notas',
      'Motivo de cancelación'
    ];

    const rows =
      this.filteredReservations.map(
        reservation => [
          reservation.code,
          reservation.customerName,
          reservation.customerPhone,
          reservation.branch,
          reservation.dateLabel,
          reservation.time,
          reservation.guests,
          reservation.occasion,
          reservation.table,
          reservation.status,
          reservation.notes,
          reservation.cancellationReason ??
            ''
        ]
      );

    const csvContent =
      [
        headers,
        ...rows
      ]
        .map(
          row =>
            row
              .map(
                value =>
                  `"${String(value)
                    .replace(
                      /"/g,
                      '""'
                    )}"`
              )
              .join(',')
        )
        .join('\n');

    const blob =
      new Blob(
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
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        'a'
      );

    anchor.href =
      downloadUrl;

    anchor.download =
      `reservas-sabor-andino-${Date.now()}.csv`;

    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(
      downloadUrl
    );

    this.showToast(
      'Lista de reservas exportada correctamente.',
      'success'
    );
  }

  /* =======================================================
     CLASES DE ESTADO
  ======================================================== */

  getStatusClass(
    status: ReservationStatus
  ): string {

    const classes:
      Record<ReservationStatus, string> = {

      Pendiente:
        'status-pending',

      Confirmada:
        'status-confirmed',

      Reprogramada:
        'status-rescheduled',

      Atendida:
        'status-attended',

      Cancelada:
        'status-cancelled'
    };

    return classes[
      status
    ];
  }

  getStatusIcon(
    status: ReservationStatus
  ): string {

    const icons:
      Record<ReservationStatus, string> = {

      Pendiente:
        'pending_actions',

      Confirmada:
        'event_available',

      Reprogramada:
        'edit_calendar',

      Atendida:
        'task_alt',

      Cancelada:
        'event_busy'
    };

    return icons[
      status
    ];
  }

  /* =======================================================
     NOTIFICACIONES
  ======================================================== */

  closeToast(): void {
    this.toastVisible =
      false;

    if (
      this.toastTimer
    ) {
      clearTimeout(
        this.toastTimer
      );

      this.toastTimer =
        null;
    }
  }

  private showToast(
    message: string,
    type: ToastType
  ): void {

    this.closeToast();

    this.toastMessage =
      message;

    this.toastType =
      type;

    this.toastVisible =
      true;

    this.toastTimer =
      setTimeout(
        () => {
          this.toastVisible =
            false;

          this.toastTimer =
            null;
        },
        3200
      );
  }

  /* =======================================================
     ALMACENAMIENTO LOCAL
  ======================================================== */

  private loadReservations(): void {
    this.api.getAdminReservations<ReservationItem[]>().subscribe({
      next: response => {
        this.reservations = response.success && Array.isArray(response.data)
          ? response.data.map((item, index) => this.normalizeReservation(item, index))
          : [];
      },
      error: () => {
        this.reservations = [];
        this.showToast('No se pudieron cargar las reservas desde la base de datos.', 'error');
      }
    });
  }

private saveReservations(): void {
    this.api.syncReservations(this.reservations).subscribe({
      next: response => {
        if (!response.success) {
          this.showToast(response.message, 'error');
          return;
        }
        this.loadReservations();
      },
      error: () => this.showToast('No se pudieron guardar las reservas en la base de datos.', 'error')
    });
  }


  private loadBranchOptions(): void {
    this.api.getAdminBranches<Array<{ name: string }>>().subscribe({
      next: response => {
        if (response.success && Array.isArray(response.data) && response.data.length > 0) {
          this.branchOptions = response.data.map(branch => branch.name);
        }
      }
    });
  }



  /* =======================================================
     NORMALIZACIÓN
  ======================================================== */

  private normalizeReservation(
    reservation:
      Partial<ReservationItem>,
    index: number
  ): ReservationItem {

    const customerName =
      reservation.customerName
        ?.trim() ||
      'Sin nombre registrado';

    const date =
      this.isValidIsoDate(
        reservation.date
      )
        ? reservation.date
        : this.getTodayIsoDate();

    const status =
      this.isReservationStatus(
        reservation.status
      )
        ? reservation.status
        : 'Pendiente';

    const guests =
      Math.min(
        30,
        Math.max(
          1,
          Number(
            reservation.guests
          ) || 1
        )
      );

    return {
      code:
        reservation.code ||
        `RES-${String(
          index + 1
        ).padStart(
          6,
          '0'
        )}`,

      customerName,

      customerPhone:
        reservation.customerPhone ||
        '',

      customerInitial:
        reservation.customerInitial ||
        customerName
          .charAt(0)
          .toUpperCase(),

      branch:
        reservation.branch ||
        this.branchOptions[0],

      date,

      dateLabel:
        this.formatDateLabel(
          date
        ),

      time:
        this.isValidTime(
          reservation.time
        )
          ? reservation.time
          : '12:00',

      guests,

      occasion:
        reservation.occasion ||
        'Sin especificar',

      table:
        reservation.table ||
        'Por asignar',

      status,

      notes:
        reservation.notes ||
        '',

      createdAt:
        reservation.createdAt ||
        this.formatCurrentDateTime(),

      updatedAt:
        reservation.updatedAt ||
        reservation.createdAt ||
        this.formatCurrentDateTime(),

      cancellationReason:
        reservation.cancellationReason
    };
  }

  /* =======================================================
     VALIDACIÓN
  ======================================================== */

  private validateReservation(
    reservation:
      ReservationItem
  ): string | null {

    return this.validateReservationData(
      reservation.customerName,
      reservation.customerPhone,
      reservation.branch,
      reservation.date,
      reservation.time,
      reservation.guests,
      reservation.occasion,
      reservation.table
    );
  }

  private validateReservationForm(
    reservation:
      ReservationForm
  ): string | null {

    return this.validateReservationData(
      reservation.customerName,
      reservation.customerPhone,
      reservation.branch,
      reservation.date,
      reservation.time,
      reservation.guests,
      reservation.occasion,
      reservation.table
    );
  }

  private validateReservationData(
    customerName: string,
    customerPhone: string,
    branch: string,
    date: string,
    time: string,
    guests: number,
    occasion: string,
    table: string
  ): string | null {

    if (
      customerName.trim().length <
      3
    ) {
      return 'Ingresa el nombre completo del cliente.';
    }

    if (
      !/^[0-9\s()+-]{7,20}$/
        .test(
          customerPhone.trim()
        )
    ) {
      return 'Ingresa un teléfono válido.';
    }

    if (
      !branch.trim()
    ) {
      return 'Selecciona una sucursal.';
    }

    if (
      !this.isValidIsoDate(
        date
      )
    ) {
      return 'Selecciona una fecha válida.';
    }

    if (
      !this.isValidTime(
        time
      )
    ) {
      return 'Selecciona una hora válida.';
    }

    const guestsNumber =
      Number(
        guests
      );

    if (
      !Number.isInteger(
        guestsNumber
      ) ||
      guestsNumber < 1 ||
      guestsNumber > 30
    ) {
      return 'El número de personas debe estar entre 1 y 30.';
    }

    if (
      occasion.trim().length <
      3
    ) {
      return 'Ingresa el motivo de la visita.';
    }

    if (
      table.trim().length <
      3
    ) {
      return 'Ingresa o asigna una mesa.';
    }

    return null;
  }

  /* =======================================================
     UTILIDADES DE RESERVAS
  ======================================================== */

  private replaceReservation(
    updatedReservation:
      ReservationItem
  ): void {

    this.reservations =
      this.reservations.map(
        reservation =>
          reservation.code ===
          updatedReservation.code
            ? updatedReservation
            : reservation
      );

    if (
      this.selectedReservation?.code ===
      updatedReservation.code
    ) {
      this.selectedReservation =
        updatedReservation;
    }

    if (
      this.editingReservation?.code ===
      updatedReservation.code
    ) {
      this.editingReservation =
        this.cloneReservation(
          updatedReservation
        );
    }

    if (
      this.reservationPendingCancellation
        ?.code ===
      updatedReservation.code
    ) {
      this.reservationPendingCancellation =
        updatedReservation;
    }

    this.saveReservations();

    this.repairCurrentPage();
  }

  private findReservationByCode(
    code: string
  ): ReservationItem | undefined {

    return this.reservations.find(
      reservation =>
        reservation.code ===
        code
    );
  }

  private cloneReservation(
    reservation:
      ReservationItem
  ): ReservationItem {

    return {
      ...reservation
    };
  }

  private createEmptyReservationForm():
    ReservationForm {

    return {
      customerName:
        '',

      customerPhone:
        '',

      branch:
        this.branchOptions[0],

      date:
        this.getTodayIsoDate(),

      time:
        '12:00',

      guests:
        2,

      occasion:
        '',

      table:
        '',

      notes:
        ''
    };
  }

  private generateNextReservationCode():
    string {

    const highestNumber =
      this.reservations.reduce(
        (
          maximum,
          reservation
        ) => {

          const numericPart =
            Number(
              reservation.code.replace(
                /\D/g,
                ''
              )
            );

          return Number.isFinite(
            numericPart
          )
            ? Math.max(
                maximum,
                numericPart
              )
            : maximum;
        },
        0
      );

    return (
      `RES-${String(
        highestNumber + 1
      ).padStart(
        6,
        '0'
      )}`
    );
  }

  private repairCurrentPage(): void {
    if (
      this.currentPage >
      this.totalPages
    ) {
      this.currentPage =
        this.totalPages;
    }

    if (
      this.currentPage < 1
    ) {
      this.currentPage = 1;
    }
  }

  /* =======================================================
     FECHAS Y FORMATO
  ======================================================== */

  private formatDateLabel(
    date: string
  ): string {

    if (
      !this.isValidIsoDate(
        date
      )
    ) {
      return date;
    }

    const [
      year,
      month,
      day
    ] =
      date.split('-');

    return (
      `${day}/${month}/${year}`
    );
  }

  private formatCurrentDateTime():
    string {

    return new Intl.DateTimeFormat(
      'es-PE',
      {
        day:
          '2-digit',

        month:
          '2-digit',

        year:
          'numeric',

        hour:
          '2-digit',

        minute:
          '2-digit',

        hour12:
          true
      }
    ).format(
      new Date()
    );
  }

  private getTodayIsoDate():
    string {

    const currentDate =
      new Date();

    const year =
      currentDate.getFullYear();

    const month =
      String(
        currentDate.getMonth() + 1
      ).padStart(
        2,
        '0'
      );

    const day =
      String(
        currentDate.getDate()
      ).padStart(
        2,
        '0'
      );

    return (
      `${year}-${month}-${day}`
    );
  }

  private isValidIsoDate(
    value: unknown
  ): value is string {

    if (
      typeof value !==
      'string'
    ) {
      return false;
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/
        .test(
          value
        )
    ) {
      return false;
    }

    const date =
      new Date(
        `${value}T00:00:00`
      );

    return !Number.isNaN(
      date.getTime()
    );
  }

  private isValidTime(
    value: unknown
  ): value is string {

    return (
      typeof value ===
        'string' &&
      /^([01]\d|2[0-3]):[0-5]\d$/
        .test(
          value
        )
    );
  }

  private normalizeText(
    value: string
  ): string {

    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(
        /[\u0300-\u036f]/g,
        ''
      );
  }

  private isReservationStatus(
    value: unknown
  ): value is ReservationStatus {

    return this.statusOptions.includes(
      value as ReservationStatus
    );
  }
}