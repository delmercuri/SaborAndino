import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  OnInit,
  Output
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaborAndinoApiService } from '../../../../core/api/sabor-andino-api.service';

interface ReservationBranch {
  id: string;
  name: string;
  location: string;
  address: string;
  phone: string;
  whatsapp: string;
}

interface ReservationOption {
  value: string;
  label: string;
}

interface ReservationData {
  branchId: string;
  date: string;
  people: number;
  time: string;
  occasion: string;
  notes: string;

  firstName: string;
  lastName: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  email: string;
  contactPreference: string;
  acceptPrivacy: boolean;

  paymentMethod: string;
  paymentReference: string;
  acceptConditions: boolean;
}

export interface ReservationProcessState {
  currentStep: number;
  stepOneCompleted: boolean;
  stepTwoCompleted: boolean;
  confirmed: boolean;
  date: string;
  timeLabel: string;
  people: number;
}

@Component({
  selector: 'app-reservation-process',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './reservation-process.html',
  styleUrl: './reservation-process.css'
})
export class ReservationProcess implements OnInit {

  @Output()
  readonly stateChange =
    new EventEmitter<ReservationProcessState>();

  readonly totalSteps = 3;
  readonly depositAmount = 30;
  readonly minimumDate = this.createMinimumDate();

  currentStep = 1;

  stepOneCompleted = false;
  stepTwoCompleted = false;
  isReservationConfirmed = false;

  confirmationCode = '';
  isSubmitting = false;
  submissionError = '';

  reservation: ReservationData = {
    branchId: '',
    date: '',
    people: 2,
    time: '',
    occasion: '',
    notes: '',

    firstName: '',
    lastName: '',
    documentType: 'DNI',
    documentNumber: '',
    phone: '',
    email: '',
    contactPreference: 'WhatsApp',
    acceptPrivacy: false,

    paymentMethod: '',
    paymentReference: '',
    acceptConditions: false
  };

  branches: ReservationBranch[] = [];

  readonly availableTimes: ReservationOption[] = [
    { value: '11:00', label: '11:00 a. m.' },
    { value: '12:00', label: '12:00 p. m.' },
    { value: '13:00', label: '1:00 p. m.' },
    { value: '14:00', label: '2:00 p. m.' },
    { value: '15:00', label: '3:00 p. m.' },
    { value: '18:00', label: '6:00 p. m.' },
    { value: '19:00', label: '7:00 p. m.' },
    { value: '20:00', label: '8:00 p. m.' },
    { value: '21:00', label: '9:00 p. m.' },
    { value: '22:00', label: '10:00 p. m.' }
  ];

  readonly occasions: ReservationOption[] = [
    {
      value: 'almuerzo-familiar',
      label: 'Almuerzo familiar'
    },
    {
      value: 'cumpleanos',
      label: 'Cumpleaños'
    },
    {
      value: 'aniversario',
      label: 'Aniversario'
    },
    {
      value: 'reunion-amigos',
      label: 'Reunión con amigos'
    },
    {
      value: 'reunion-trabajo',
      label: 'Reunión de trabajo'
    },
    {
      value: 'cena-especial',
      label: 'Cena especial'
    },
    {
      value: 'otro',
      label: 'Otro motivo'
    }
  ];

  readonly documentTypes: string[] = [
    'DNI',
    'Carné de extranjería',
    'Pasaporte'
  ];

  readonly contactPreferences: string[] = [
    'WhatsApp',
    'Llamada telefónica',
    'Correo electrónico'
  ];

  constructor(private readonly api: SaborAndinoApiService) {}

  ngOnInit(): void {
    this.emitState();
    this.loadBranches();
  }

  get selectedBranch(): ReservationBranch | undefined {
    return this.branches.find(
      branch => branch.id === this.reservation.branchId
    );
  }

  get whatsappNumber(): string {
    const branch = this.selectedBranch ?? this.branches.find(item => Boolean(item.whatsapp || item.phone));
    return this.normalizeWhatsapp(branch?.whatsapp || branch?.phone || '');
  }

  get selectedTimeLabel(): string {
    return (
      this.availableTimes.find(
        time => time.value === this.reservation.time
      )?.label ?? ''
    );
  }

  get selectedOccasionLabel(): string {
    return (
      this.occasions.find(
        occasion =>
          occasion.value === this.reservation.occasion
      )?.label ?? ''
    );
  }

  get formattedDate(): string {
    if (!this.reservation.date) {
      return '';
    }

    const parts =
      this.reservation.date
        .split('-')
        .map(Number);

    if (
      parts.length !== 3 ||
      parts.some(value => !Number.isFinite(value))
    ) {
      return '';
    }

    const [year, month, day] = parts;

    const date = new Date(
      year,
      month - 1,
      day
    );

    return date.toLocaleDateString(
      'es-PE',
      {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }
    );
  }

  get fullName(): string {
    return [
      this.reservation.firstName,
      this.reservation.lastName
    ]
      .filter(Boolean)
      .join(' ');
  }

  get notesLength(): number {
    return this.reservation.notes.length;
  }

  get isStepOneValid(): boolean {
    return Boolean(
      this.reservation.branchId &&
      this.reservation.date &&
      this.reservation.time &&
      this.reservation.occasion &&
      this.reservation.people >= 1 &&
      this.reservation.people <= 20
    );
  }

  get isStepTwoValid(): boolean {
    const emailIsValid =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        .test(this.reservation.email.trim());

    const phoneIsValid =
      /^[0-9]{9}$/
        .test(this.reservation.phone.trim());

    const documentIsValid =
      this.reservation.documentNumber
        .trim()
        .length >= 8;

    return Boolean(
      this.reservation.firstName.trim() &&
      this.reservation.lastName.trim() &&
      documentIsValid &&
      phoneIsValid &&
      emailIsValid &&
      this.reservation.contactPreference &&
      this.reservation.acceptPrivacy
    );
  }

  get isStepThreeValid(): boolean {
    const paymentReferenceIsValid =
      this.reservation.paymentMethod !== 'Yape' ||
      this.reservation.paymentReference
        .trim()
        .length >= 4;

    return Boolean(
      this.reservation.paymentMethod &&
      paymentReferenceIsValid &&
      this.reservation.acceptConditions
    );
  }

  updateReservationDate(): void {
    this.reservation.time = '';
    this.emitState();
  }

  changePeople(change: number): void {
    this.reservation.people = Math.min(
      20,
      Math.max(
        1,
        this.reservation.people + change
      )
    );

    this.emitState();
  }

  continueToStepTwo(): void {
    if (!this.isStepOneValid) {
      return;
    }

    this.stepOneCompleted = true;
    this.currentStep = 2;

    this.emitState();
    this.scrollToProcess();
  }

  continueToStepThree(): void {
    if (!this.isStepTwoValid) {
      return;
    }

    this.stepTwoCompleted = true;
    this.currentStep = 3;

    this.emitState();
    this.scrollToProcess();
  }

  previousStep(): void {
    if (this.currentStep <= 1) {
      return;
    }

    this.currentStep--;

    this.emitState();
    this.scrollToProcess();
  }

  goToStep(step: number): void {
    if (step === 1) {
      this.currentStep = 1;
    }

    if (
      step === 2 &&
      this.stepOneCompleted
    ) {
      this.currentStep = 2;
    }

    if (
      step === 3 &&
      this.stepOneCompleted &&
      this.stepTwoCompleted
    ) {
      this.currentStep = 3;
    }

    this.emitState();
    this.scrollToProcess();
  }

  confirmReservation(): void {
    if (!this.isStepThreeValid || this.isSubmitting) {
      return;
    }

    this.isSubmitting = true;
    this.submissionError = '';

    this.api.createReservation<{ code: string }>({
      branchId: this.reservation.branchId,
      date: this.reservation.date,
      time: this.reservation.time,
      people: this.reservation.people,
      occasion: this.selectedOccasionLabel || this.reservation.occasion,
      notes: this.reservation.notes,
      firstName: this.reservation.firstName,
      lastName: this.reservation.lastName,
      documentType: this.reservation.documentType,
      documentNumber: this.reservation.documentNumber,
      phone: this.reservation.phone,
      email: this.reservation.email,
      contactPreference: this.reservation.contactPreference,
      paymentMethod: this.reservation.paymentMethod,
      paymentReference: this.reservation.paymentReference,
      depositAmount: this.depositAmount,
      acceptPrivacy: this.reservation.acceptPrivacy,
      acceptConditions: this.reservation.acceptConditions
    }).subscribe({
      next: response => {
        this.isSubmitting = false;
        if (!response.success || !response.data?.code) {
          this.submissionError = response.message || 'No se pudo registrar la reserva.';
          return;
        }

        this.confirmationCode = response.data.code;
        this.isReservationConfirmed = true;
        this.stepOneCompleted = true;
        this.stepTwoCompleted = true;
        this.currentStep = 3;
        this.emitState();
        this.scrollToProcess();
      },
      error: () => {
        this.isSubmitting = false;
        this.submissionError = 'No se pudo conectar con el backend. Verifica que saborandino-api esté activo.';
      }
    });
  }

  startNewReservation(): void {
    this.currentStep = 1;

    this.stepOneCompleted = false;
    this.stepTwoCompleted = false;
    this.isReservationConfirmed = false;

    this.confirmationCode = '';
    this.submissionError = '';
    this.isSubmitting = false;

    this.reservation = {
      branchId: '',
      date: '',
      people: 2,
      time: '',
      occasion: '',
      notes: '',

      firstName: '',
      lastName: '',
      documentType: 'DNI',
      documentNumber: '',
      phone: '',
      email: '',
      contactPreference: 'WhatsApp',
      acceptPrivacy: false,

      paymentMethod: '',
      paymentReference: '',
      acceptConditions: false
    };

    this.emitState();
    this.scrollToProcess();
  }

  openWhatsApp(): void {
    const whatsapp = this.whatsappNumber;
    if (!whatsapp) return;

    const message = encodeURIComponent(
      'Hola Sabor Andino, necesito ayuda con mi reserva.'
    );

    window.open(
      `https://wa.me/${whatsapp}?text=${message}`,
      '_blank',
      'noopener,noreferrer'
    );
  }

  downloadConfirmation(): void {
    if (!this.isReservationConfirmed) {
      return;
    }

    const content = [
      'SABOR ANDINO',
      'CONFIRMACIÓN DE RESERVA',
      '',
      `Código: ${this.confirmationCode}`,
      `Cliente: ${this.fullName}`,
      `Sucursal: ${this.selectedBranch?.name ?? ''}`,
      `Dirección: ${this.selectedBranch?.address ?? ''}`,
      `Fecha: ${this.formattedDate}`,
      `Horario: ${this.selectedTimeLabel}`,
      `Personas: ${this.reservation.people}`,
      `Motivo: ${this.selectedOccasionLabel}`,
      `Adelanto: S/ ${this.depositAmount.toFixed(2)}`
    ].join('\n');

    const blob = new Blob(
      [content],
      {
        type: 'text/plain;charset=utf-8'
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;
    link.download =
      `reserva-${this.confirmationCode}.txt`;

    link.click();

    URL.revokeObjectURL(url);
  }

  emitState(): void {
  this.stateChange.emit({
    currentStep: this.currentStep,
    stepOneCompleted: this.stepOneCompleted,
    stepTwoCompleted: this.stepTwoCompleted,
    confirmed: this.isReservationConfirmed,
    date: this.reservation.date,
    timeLabel: this.selectedTimeLabel,
    people: this.reservation.people
  });
}

  private loadBranches(): void {
    this.api.getPublicBranches<Array<Record<string, unknown>>>().subscribe({
      next: response => {
        if (!response.success || !Array.isArray(response.data) || response.data.length === 0) {
          return;
        }

        this.branches = response.data.map(item => ({
          id: String(item['idBranch'] || item['code'] || item['id'] || ''),
          name: String(item['name'] ?? ''),
          location: String(item['location'] || [item['district'], item['department']].filter(Boolean).join(', ')),
          address: String(item['address'] ?? ''),
          phone: String(item['phone'] ?? ''),
          whatsapp: String(item['whatsapp'] ?? '')
        }));
      },
      error: () => {
        this.branches = [];
      }
    });
  }

  private normalizeWhatsapp(value: string): string {
    let number = String(value || '').replace(/\D/g, '');
    if (number.length === 9) number = `51${number}`;
    return number;
  }

  private scrollToProcess(): void {
    window.requestAnimationFrame(() => {
      document
        .getElementById('reservation-form-process')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
    });
  }

  private generateConfirmationCode(): string {
    const date = new Date();

    const year =
      String(date.getFullYear())
        .slice(-2);

    const month =
      String(date.getMonth() + 1)
        .padStart(2, '0');

    const day =
      String(date.getDate())
        .padStart(2, '0');

    const random =
      Math.floor(
        1000 + Math.random() * 9000
      );

    return `SA-${year}${month}${day}-${random}`;
  }

  private createMinimumDate(): string {
    const date = new Date();

    const year =
      date.getFullYear();

    const month =
      String(date.getMonth() + 1)
        .padStart(2, '0');

    const day =
      String(date.getDate())
        .padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}