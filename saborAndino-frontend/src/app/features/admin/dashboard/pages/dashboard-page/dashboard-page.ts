import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

import {
  DashboardSummary
} from '../../components/dashboard-summary/dashboard-summary';

import {
  OrdersStatusChart
} from '../../components/orders-status-chart/orders-status-chart';

import {
  ReservationsStatusChart
} from '../../components/reservations-status-chart/reservations-status-chart';

import {
  BranchOrdersChart
} from '../../components/branch-orders-chart/branch-orders-chart';

import {
  PopularProducts
} from '../../components/popular-products/popular-products';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    DashboardSummary,
    OrdersStatusChart,
    ReservationsStatusChart,
    BranchOrdersChart,
    PopularProducts
  ],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.css'
})
export class DashboardPage {

  readonly currentDate = new Date();

  readonly currentDateLabel =
    new Intl.DateTimeFormat(
      'es-PE',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }
    ).format(this.currentDate);

  readonly currentDayLabel =
    new Intl.DateTimeFormat(
      'es-PE',
      {
        weekday: 'long'
      }
    ).format(this.currentDate);

}