import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface Advantage {
  title: string;
  description: string;
  icon: string;
  className: string;
}

@Component({
  selector: 'app-advantages',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './advantages.html',
  styleUrl: './advantages.css'
})
export class Advantages {

  readonly advantages: Advantage[] = [
    {
      title: 'Ingredientes seleccionados',
      description:
        'Trabajamos con productos frescos y proveedores de confianza.',
      icon: 'eco',
      className: 'ingredients'
    },
    {
      title: 'Preparación al momento',
      description:
        'Cada pedido se prepara después de recibir tu confirmación.',
      icon: 'soup_kitchen',
      className: 'preparation'
    },
    {
      title: 'Delivery seguro',
      description:
        'Seguimiento del pedido desde la cocina hasta tu dirección.',
      icon: 'delivery_dining',
      className: 'delivery'
    },
    {
      title: 'Pagos protegidos',
      description:
        'Realiza pagos mediante Yape, tarjeta o efectivo.',
      icon: 'credit_score',
      className: 'payments'
    }
  ];

  trackByAdvantageTitle(
    index: number,
    advantage: Advantage
  ): string {
    return advantage.title;
  }
}