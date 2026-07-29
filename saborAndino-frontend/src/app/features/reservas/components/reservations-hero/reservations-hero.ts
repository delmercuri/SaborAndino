import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

@Component({
  selector: 'app-reservations-hero',
  standalone: true,
  imports: [],
  templateUrl: './reservations-hero.html',
  styleUrl: './reservations-hero.css'
})
export class ReservationsHero {

  /*
   * Estos valores vendrán posteriormente desde
   * el formulario de reserva.
   */

  @Input()
  reservationDate = '';

  @Input()
  selectedTimeLabel = '';

  @Input()
  peopleCount = 2;

  /*
   * Informa a ReservationsPage que debe bajar
   * hacia el proceso de reserva.
   */

  @Output()
  readonly continueRequested =
    new EventEmitter<void>();

  get formattedReservationDate(): string {
    return this.formatReservationDate(
      this.reservationDate
    );
  }

  requestContinueReservation(): void {
    this.continueRequested.emit();
  }

  private formatReservationDate(
    dateValue: string
  ): string {
    if (!dateValue) {
      return 'No seleccionada';
    }

    const dateParts =
      dateValue
        .split('-')
        .map(Number);

    if (
      dateParts.length !== 3 ||
      dateParts.some(
        value => !Number.isFinite(value)
      )
    ) {
      return 'Fecha inválida';
    }

    const [
      year,
      month,
      day
    ] = dateParts;

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
}