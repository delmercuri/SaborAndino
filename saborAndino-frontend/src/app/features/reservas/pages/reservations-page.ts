import {
  Component,
  ViewChild
} from '@angular/core';

import {
  ReservationsHero
} from '../components/reservations-hero/reservations-hero';

import {
  ReservationsProgress
} from '../components/reservations-progress/reservations-progress';

import {
  ReservationProcess,
  ReservationProcessState
} from '../components/reservation-process/reservation-process';

@Component({
  selector: 'app-reservations-page',
  standalone: true,
  imports: [
    ReservationsHero,
    ReservationsProgress,
    ReservationProcess
  ],
  templateUrl: './reservations-page.html',
  styleUrl: './reservations-page.css'
})
export class ReservationsPage {

  @ViewChild(ReservationProcess)
  private reservationProcess?: ReservationProcess;

  processState: ReservationProcessState = {
    currentStep: 1,
    stepOneCompleted: false,
    stepTwoCompleted: false,
    confirmed: false,
    date: '',
    timeLabel: '',
    people: 2
  };

  onProcessStateChange(
    state: ReservationProcessState
  ): void {
    this.processState = state;
  }

  goToStep(step: number): void {
    this.reservationProcess?.goToStep(step);
  }

  scrollToReservationProcess(): void {
    window.requestAnimationFrame(() => {
      document
        .getElementById('reservation-process')
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
    });
  }
}