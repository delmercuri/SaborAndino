import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SaborAndinoApiService } from '../../../../../core/api/sabor-andino-api.service';

type BranchName =
  | 'Lima'
  | 'Apurímac'
  | 'Ayacucho';

type OrderStatus =
  | 'Entregado'
  | 'En preparación'
  | 'Confirmado'
  | 'Listo'
  | 'En camino'
  | 'Pendiente'
  | 'Cancelado';

type PaymentMethod =
  | 'Yape'
  | 'Tarjeta'
  | 'Efectivo';

type ReservationStatus =
  | 'Confirmada'
  | 'Pendiente'
  | 'Reprogramada'
  | 'Atendida'
  | 'Cancelada';

interface SaleRecord {
  id: number;
  date: string;
  orderCode: string;
  branch: BranchName;
  customer: string;
  product: string;
  category: string;
  quantity: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
}

interface ReservationRecord {
  id: number;
  date: string;
  code: string;
  branch: BranchName;
  customer: string;
  people: number;
  status: ReservationStatus;
}

interface ClientSnapshot {
  id: number;
  registrationDate: string;
  department: string;
  status: string;
}

interface MonthlyReport {
  key: string;
  label: string;
  sales: number;
  orders: number;
}

interface BranchReport {
  branch: BranchName;
  sales: number;
  orders: number;
  reservations: number;
  customers: number;
  averageTicket: number;
}

interface ProductReport {
  name: string;
  category: string;
  quantity: number;
  sales: number;
}

interface StatusReport {
  status: OrderStatus;
  count: number;
  percentage: number;
  className: string;
}

interface PaymentReport {
  paymentMethod: PaymentMethod;
  count: number;
  amount: number;
  percentage: number;
  icon: string;
}

@Component({
  selector: 'app-admin-reports-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './reports-page.html',
  styleUrl: './reports-page.css'
})
export class AdminReportsPage {

  dateFrom = '';
  dateTo = '';

  selectedBranch: '' | BranchName = '';
  selectedStatus: '' | OrderStatus = '';
  selectedPaymentMethod: '' | PaymentMethod = '';

  branchOptions: BranchName[] = [];

  readonly statusOptions: OrderStatus[] = [
    'Entregado',
    'En preparación',
    'Pendiente',
    'Cancelado'
  ];

  readonly paymentMethodOptions: PaymentMethod[] = [
    'Yape',
    'Tarjeta',
    'Efectivo'
  ];

  private clientsSnapshot: ClientSnapshot[] = [];

  salesRecords: SaleRecord[] = [];

  reservationRecords: ReservationRecord[] = [];

  constructor(private readonly api: SaborAndinoApiService) {
    this.resetFilters();
    this.loadBranchOptions();
    this.loadReports();
  }

  get filteredSales(): SaleRecord[] {
    return this.salesRecords.filter(record => {

      const matchesDate =
        this.isDateInsideRange(record.date);

      const matchesBranch =
        !this.selectedBranch ||
        record.branch === this.selectedBranch;

      const matchesStatus =
        !this.selectedStatus ||
        record.status === this.selectedStatus;

      const matchesPayment =
        !this.selectedPaymentMethod ||
        record.paymentMethod ===
          this.selectedPaymentMethod;

      return (
        matchesDate &&
        matchesBranch &&
        matchesStatus &&
        matchesPayment
      );
    });
  }

  get validSales(): SaleRecord[] {
    return this.filteredSales.filter(
      record => record.status !== 'Cancelado'
    );
  }

  get filteredReservations(): ReservationRecord[] {
    return this.reservationRecords.filter(record => {

      const matchesDate =
        this.isDateInsideRange(record.date);

      const matchesBranch =
        !this.selectedBranch ||
        record.branch === this.selectedBranch;

      return matchesDate && matchesBranch;
    });
  }

  get filteredClients(): ClientSnapshot[] {
    return this.clientsSnapshot.filter(client => {

      const matchesDate =
        this.isDateInsideRange(
          client.registrationDate
        );

      const matchesBranch =
        !this.selectedBranch ||
        client.department ===
          this.selectedBranch;

      return matchesDate && matchesBranch;
    });
  }

  get totalSales(): number {
    return this.validSales.reduce(
      (total, record) =>
        total + Number(record.amount),
      0
    );
  }

  get totalOrders(): number {
    return this.filteredSales.length;
  }

  get completedOrders(): number {
    return this.filteredSales.filter(
      record => record.status === 'Entregado'
    ).length;
  }

  get cancelledOrders(): number {
    return this.filteredSales.filter(
      record => record.status === 'Cancelado'
    ).length;
  }

  get totalReservations(): number {
    return this.filteredReservations.length;
  }

  get registeredClients(): number {
    return this.filteredClients.length;
  }

  get totalProductsSold(): number {
    return this.validSales.reduce(
      (total, record) =>
        total + Number(record.quantity),
      0
    );
  }

  get averageTicket(): number {
    if (this.validSales.length === 0) {
      return 0;
    }

    return (
      this.totalSales /
      this.validSales.length
    );
  }

  get cancellationRate(): number {
    if (this.totalOrders === 0) {
      return 0;
    }

    return (
      this.cancelledOrders /
      this.totalOrders
    ) * 100;
  }

  get monthlyReport(): MonthlyReport[] {
    const groupedMonths =
      new Map<string, MonthlyReport>();

    this.validSales.forEach(record => {
      const monthKey =
        record.date.substring(0, 7);

      const currentMonth =
        groupedMonths.get(monthKey);

      if (currentMonth) {
        currentMonth.sales += record.amount;
        currentMonth.orders += 1;
        return;
      }

      groupedMonths.set(
        monthKey,
        {
          key: monthKey,
          label:
            this.getMonthLabel(monthKey),
          sales: record.amount,
          orders: 1
        }
      );
    });

    return Array.from(
      groupedMonths.values()
    ).sort(
      (first, second) =>
        first.key.localeCompare(
          second.key
        )
    );
  }

  get maxMonthlySales(): number {
    if (this.monthlyReport.length === 0) {
      return 0;
    }

    return Math.max(
      ...this.monthlyReport.map(
        month => month.sales
      )
    );
  }

  get branchReport(): BranchReport[] {
    return this.branchOptions.map(branch => {

      const branchSales =
        this.validSales.filter(
          record => record.branch === branch
        );

      const branchOrders =
        this.filteredSales.filter(
          record => record.branch === branch
        );

      const branchReservations =
        this.filteredReservations.filter(
          record => record.branch === branch
        );

      const uniqueCustomers =
        new Set(
          branchSales.map(
            record => record.customer
          )
        );

      const totalBranchSales =
        branchSales.reduce(
          (total, record) =>
            total + record.amount,
          0
        );

      return {
        branch,
        sales: totalBranchSales,
        orders: branchOrders.length,
        reservations:
          branchReservations.length,
        customers:
          uniqueCustomers.size,
        averageTicket:
          branchSales.length > 0
            ? totalBranchSales /
              branchSales.length
            : 0
      };
    });
  }

  get productReport(): ProductReport[] {
    const productMap =
      new Map<string, ProductReport>();

    this.validSales.forEach(record => {

      const currentProduct =
        productMap.get(record.product);

      if (currentProduct) {
        currentProduct.quantity +=
          record.quantity;

        currentProduct.sales +=
          record.amount;

        return;
      }

      productMap.set(
        record.product,
        {
          name: record.product,
          category: record.category,
          quantity: record.quantity,
          sales: record.amount
        }
      );
    });

    return Array.from(
      productMap.values()
    )
      .sort(
        (first, second) =>
          second.quantity -
          first.quantity
      )
      .slice(0, 6);
  }

  get maxProductQuantity(): number {
    if (this.productReport.length === 0) {
      return 0;
    }

    return Math.max(
      ...this.productReport.map(
        product => product.quantity
      )
    );
  }

  get statusReport(): StatusReport[] {
    return this.statusOptions.map(status => {

      const count =
        this.filteredSales.filter(
          record => record.status === status
        ).length;

      return {
        status,
        count,
        percentage:
          this.totalOrders > 0
            ? (
                count /
                this.totalOrders
              ) * 100
            : 0,
        className:
          this.getStatusClass(status)
      };
    });
  }

  get paymentReport(): PaymentReport[] {
    return this.paymentMethodOptions.map(
      paymentMethod => {

        const paymentRecords =
          this.validSales.filter(
            record =>
              record.paymentMethod ===
              paymentMethod
          );

        const amount =
          paymentRecords.reduce(
            (total, record) =>
              total + record.amount,
            0
          );

        return {
          paymentMethod,
          count: paymentRecords.length,
          amount,
          percentage:
            this.totalSales > 0
              ? (
                  amount /
                  this.totalSales
                ) * 100
              : 0,
          icon:
            this.getPaymentIcon(
              paymentMethod
            )
        };
      }
    );
  }

  get recentSales(): SaleRecord[] {
    return [...this.filteredSales]
      .sort(
        (first, second) =>
          second.date.localeCompare(
            first.date
          )
      )
      .slice(0, 8);
  }

  resetFilters(): void {
    const today = new Date();

    const year =
      today.getFullYear();

    const month =
      String(
        today.getMonth() + 1
      ).padStart(2, '0');

    const day =
      String(
        today.getDate()
      ).padStart(2, '0');

    this.dateFrom = `${year}-01-01`;
    this.dateTo = `${year}-${month}-${day}`;

    this.selectedBranch = '';
    this.selectedStatus = '';
    this.selectedPaymentMethod = '';
  }

  printReport(): void {
    window.print();
  }

  exportReport(): void {
    const reportRows: string[][] = [
      [
        'REPORTE GENERAL DE SABOR ANDINO'
      ],
      [],
      [
        'Fecha inicial',
        this.dateFrom
      ],
      [
        'Fecha final',
        this.dateTo
      ],
      [
        'Sucursal',
        this.selectedBranch || 'Todas'
      ],
      [
        'Estado',
        this.selectedStatus || 'Todos'
      ],
      [
        'Método de pago',
        this.selectedPaymentMethod || 'Todos'
      ],
      [],
      [
        'RESUMEN'
      ],
      [
        'Ventas totales',
        this.totalSales.toFixed(2)
      ],
      [
        'Pedidos registrados',
        this.totalOrders.toString()
      ],
      [
        'Clientes registrados',
        this.registeredClients.toString()
      ],
      [
        'Reservas registradas',
        this.totalReservations.toString()
      ],
      [
        'Ticket promedio',
        this.averageTicket.toFixed(2)
      ],
      [
        'Productos vendidos',
        this.totalProductsSold.toString()
      ],
      [],
      [
        'DETALLE DE PEDIDOS'
      ],
      [
        'Fecha',
        'Código',
        'Sucursal',
        'Cliente',
        'Producto',
        'Categoría',
        'Cantidad',
        'Importe',
        'Pago',
        'Estado'
      ]
    ];

    this.filteredSales.forEach(record => {
      reportRows.push([
        record.date,
        record.orderCode,
        record.branch,
        record.customer,
        record.product,
        record.category,
        record.quantity.toString(),
        record.amount.toFixed(2),
        record.paymentMethod,
        record.status
      ]);
    });

    const csvContent =
      reportRows
        .map(row =>
          row
            .map(value =>
              this.escapeCsv(value)
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

    const downloadLink =
      document.createElement('a');

    downloadLink.href = downloadUrl;

    downloadLink.download =
      `reporte-sabor-andino-${this.dateFrom}-${this.dateTo}.csv`;

    document.body.appendChild(
      downloadLink
    );

    downloadLink.click();
    downloadLink.remove();

    URL.revokeObjectURL(
      downloadUrl
    );
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
      return 'Sin fecha';
    }

    const date =
      new Date(
        `${dateValue}T12:00:00`
      );

    return new Intl.DateTimeFormat(
      'es-PE',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }
    ).format(date);
  }

  getMonthlyBarHeight(
    amount: number
  ): number {
    if (
      this.maxMonthlySales === 0 ||
      amount === 0
    ) {
      return 0;
    }

    return Math.max(
      8,
      (
        amount /
        this.maxMonthlySales
      ) * 100
    );
  }

  getProductPercentage(
    quantity: number
  ): number {
    if (
      this.maxProductQuantity === 0
    ) {
      return 0;
    }

    return (
      quantity /
      this.maxProductQuantity
    ) * 100;
  }

  getBranchSalesPercentage(
    sales: number
  ): number {
    if (this.totalSales === 0) {
      return 0;
    }

    return (
      sales /
      this.totalSales
    ) * 100;
  }

  getStatusClass(
    status: OrderStatus
  ): string {
    const classes:
      Record<OrderStatus, string> = {

      'Entregado':
        'status-delivered',

      'En preparación':
        'status-preparing',

      'Confirmado':
        'status-preparing',

      'Listo':
        'status-delivered',

      'En camino':
        'status-preparing',

      'Pendiente':
        'status-pending',

      'Cancelado':
        'status-cancelled'
    };

    return classes[status];
  }

  getPaymentIcon(
    paymentMethod: PaymentMethod
  ): string {
    const icons:
      Record<PaymentMethod, string> = {

      'Yape':
        'qr_code_2',

      'Tarjeta':
        'credit_card',

      'Efectivo':
        'payments'
    };

    return icons[paymentMethod];
  }

  trackBySaleId(
    index: number,
    record: SaleRecord
  ): number {
    return record.id;
  }

  trackByMonth(
    index: number,
    month: MonthlyReport
  ): string {
    return month.key;
  }

  trackByBranch(
    index: number,
    branch: BranchReport
  ): BranchName {
    return branch.branch;
  }

  trackByProduct(
    index: number,
    product: ProductReport
  ): string {
    return product.name;
  }

  private isDateInsideRange(
    dateValue: string
  ): boolean {
    const matchesFrom =
      !this.dateFrom ||
      dateValue >= this.dateFrom;

    const matchesTo =
      !this.dateTo ||
      dateValue <= this.dateTo;

    return matchesFrom && matchesTo;
  }

  private getMonthLabel(
    monthKey: string
  ): string {
    const date =
      new Date(
        `${monthKey}-01T12:00:00`
      );

    const label =
      new Intl.DateTimeFormat(
        'es-PE',
        {
          month: 'short'
        }
      ).format(date);

    return (
      label.charAt(0).toUpperCase() +
      label.slice(1).replace('.', '')
    );
  }

  private escapeCsv(
    value: string
  ): string {
    return `"${String(value).replace(
      /"/g,
      '""'
    )}"`;
  }

  private loadBranchOptions(): void {
    this.api.getAdminBranches<Array<Record<string, unknown>>>().subscribe({
      next: response => {
        if (!response.success || !Array.isArray(response.data)) return;
        const locations = response.data
          .map(item => this.toBranch(String(item['department'] || item['name'] || '')));
        this.branchOptions = Array.from(new Set<BranchName>(locations));
      },
      error: () => {
        this.branchOptions = [];
      }
    });
  }

  private loadReports(): void {
    this.api.getReports<Record<string, unknown>>(this.dateFrom, this.dateTo).subscribe({
      next: response => {
        if (!response.success || !response.data) {
          this.loadClientsSnapshot();
          return;
        }

        const sales = Array.isArray(response.data['sales'])
          ? response.data['sales'] as Array<Record<string, unknown>>
          : [];
        const reservations = Array.isArray(response.data['reservations'])
          ? response.data['reservations'] as Array<Record<string, unknown>>
          : [];
        const clients = Array.isArray(response.data['clients'])
          ? response.data['clients'] as Array<Record<string, unknown>>
          : [];

        this.salesRecords = sales.map((row, index) => ({
          id: index + 1,
          date: String(row['date'] ?? '').substring(0, 10),
          orderCode: String(row['orderCode'] ?? ''),
          branch: this.toBranch(String(row['branch'] ?? '')),
          customer: String(row['customer'] ?? ''),
          product: String(row['product'] ?? ''),
          category: String(row['category'] ?? ''),
          quantity: Number(row['quantity'] ?? 0),
          amount: Number(row['amount'] ?? 0),
          paymentMethod: this.toPayment(String(row['paymentMethod'] ?? '')),
          status: this.toOrderStatus(String(row['status'] ?? ''))
        }));

        this.reservationRecords = reservations.map((row, index) => ({
          id: index + 1,
          date: String(row['date'] ?? '').substring(0, 10),
          code: String(row['code'] ?? ''),
          branch: this.toBranch(String(row['branch'] ?? '')),
          customer: String(row['customer'] ?? ''),
          people: Number(row['people'] ?? 0),
          status: this.toReservationStatus(String(row['status'] ?? ''))
        }));

        this.clientsSnapshot = clients.map((row, index) => ({
          id: Number(row['id'] ?? index + 1),
          registrationDate: String(row['registrationDate'] ?? '').substring(0, 10),
          department: String(row['department'] ?? ''),
          status: String(row['status'] ?? '')
        }));

        const foundBranches = Array.from(new Set([
          ...this.salesRecords.map(item => item.branch),
          ...this.reservationRecords.map(item => item.branch)
        ]));
        if (foundBranches.length > 0) this.branchOptions = foundBranches;
      },
      error: () => this.loadClientsSnapshot()
    });
  }

  private toBranch(value: string): BranchName {
    const normalized = value.toLocaleLowerCase('es');
    if (normalized.includes('apur')) return 'Apurímac';
    if (normalized.includes('ayac')) return 'Ayacucho';
    return 'Lima';
  }

  private toPayment(value: string): PaymentMethod {
    const normalized = value.toLocaleLowerCase('es');
    if (normalized.includes('yape')) return 'Yape';
    if (normalized.includes('tarjeta')) return 'Tarjeta';
    return 'Efectivo';
  }

  private toOrderStatus(value: string): OrderStatus {
    const map: Record<string, OrderStatus> = {
      ENTREGADO: 'Entregado', EN_PREPARACION: 'En preparación', CONFIRMADO: 'Confirmado',
      LISTO: 'Listo', EN_CAMINO: 'En camino', CANCELADO: 'Cancelado', PENDIENTE: 'Pendiente'
    };
    return map[value.toUpperCase()] ?? 'Pendiente';
  }

  private toReservationStatus(value: string): ReservationStatus {
    const map: Record<string, ReservationStatus> = {
      CONFIRMADA: 'Confirmada', PENDIENTE: 'Pendiente', REPROGRAMADA: 'Reprogramada',
      ATENDIDA: 'Atendida', CANCELADA: 'Cancelada'
    };
    return map[value.toUpperCase()] ?? 'Pendiente';
  }

  private loadClientsSnapshot(): void {
    this.clientsSnapshot = [];
    this.salesRecords = [];
    this.reservationRecords = [];
  }

}