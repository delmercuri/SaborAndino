import { CommonModule } from '@angular/common';

import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

export type ReservationStepStatus =
  | 'active'
  | 'completed'
  | 'pending';

@Component({
  selector: 'app-reservations-progress',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './reservations-progress.html',
  styleUrl: './reservations-progress.css'
})
export class ReservationsProgress {

  /* =====================================================
     ESTADO RECIBIDO DESDE RESERVATIONS PAGE
  ====================================================== */

  @Input()
  currentStep = 1;

  @Input()
  totalSteps = 3;

  @Input()
  stepOneCompleted = false;

  @Input()
  stepTwoCompleted = false;

  @Input()
  isReservationConfirmed = false;

  /* =====================================================
     EVENTO DE CAMBIO DE PASO
  ====================================================== */

  @Output()
  readonly stepSelected =
    new EventEmitter<number>();

  /* =====================================================
     PORCENTAJE DEL PROCESO
  ====================================================== */

  get progressPercentage(): number {
    if (this.isReservationConfirmed) {
      return 100;
    }

    const safeTotalSteps =
      Math.max(this.totalSteps, 1);

    const percentage = Math.round(
      (
        (this.currentStep - 1) /
        safeTotalSteps
      ) * 100
    );

    return Math.min(
      100,
      Math.max(0, percentage)
    );
  }

  /* =====================================================
     ESTADO VISUAL DE CADA PASO
  ====================================================== */

  getStepStatus(
    step: number
  ): ReservationStepStatus {
    if (this.isReservationConfirmed) {
      return 'completed';
    }

    if (step < this.currentStep) {
      return 'completed';
    }

    if (step === this.currentStep) {
      return 'active';
    }

    return 'pending';
  }

  /* =====================================================
     BLOQUEO DE PASOS
  ====================================================== */

  isStepDisabled(
    step: number
  ): boolean {
    if (step === 1) {
      return false;
    }

    if (step === 2) {
      return !this.stepOneCompleted;
    }

    if (step === 3) {
      return (
        !this.stepOneCompleted ||
        !this.stepTwoCompleted
      );
    }

    return true;
  }

  /* =====================================================
     SELECCIÓN DEL PASO
  ====================================================== */

  selectStep(
    step: number
  ): void {
    if (
      step < 1 ||
      step > this.totalSteps ||
      this.isStepDisabled(step)
    ) {
      return;
    }

    this.stepSelected.emit(step);
  }
}