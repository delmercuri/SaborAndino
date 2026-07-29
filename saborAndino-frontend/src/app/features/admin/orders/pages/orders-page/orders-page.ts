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

type OrderType =
  | 'Delivery'
  | 'Recojo';

type OrderStatus =
  | 'Pendiente'
  | 'Confirmado'
  | 'En preparación'
  | 'Listo'
  | 'En camino'
  | 'Entregado'
  | 'Cancelado';

type OrderStatusFilter =
  | ''
  | OrderStatus;

type PaymentType =
  | 'Yape'
  | 'Tarjeta BCP'
  | 'Efectivo';

type ToastType =
  | 'success'
  | 'error'
  | 'info';

/* =========================================================
   INTERFACES
========================================================= */

interface OrderProduct {
  name: string;
  quantity: number;
  unitPrice: number;
}

interface OrderHistoryEntry {
  status: OrderStatus;
  dateTime: string;
  note: string;
}

interface OrderItem {
  code: string;

  customerName: string;
  customerPhone: string;
  customerInitial: string;

  type: OrderType;
  branch: string;

  dateTime: string;
  updatedAt: string;

  payment: PaymentType;
  total: number;
  status: OrderStatus;

  address: string;
  reference: string;
  notes: string;

  products: OrderProduct[];
  history: OrderHistoryEntry[];

  cancellationReason?: string;
}

interface QuickStatusOption {
  label: string;
  value: OrderStatusFilter;
  icon: string;
}

/* =========================================================
   COMPONENTE
========================================================= */

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.css'
})
export class OrdersPage implements OnInit, OnDestroy {

  /* =======================================================
     FILTROS
  ======================================================== */

  searchTerm = '';

  selectedStatus:
    OrderStatusFilter = '';

  selectedType = '';
  selectedBranch = '';

  /* =======================================================
     PAGINACIÓN
  ======================================================== */

  currentPage = 1;

  readonly pageSize = 8;

  /* =======================================================
     MODALES
  ======================================================== */

  detailsModalOpen = false;
  editOrderModalOpen = false;
  cancellationModalOpen = false;

  selectedOrder:
    OrderItem | null = null;

  editingOrder:
    OrderItem | null = null;

  orderPendingCancellation:
    OrderItem | null = null;

  editOrderError = '';

  cancellationReason = '';
  cancellationError = '';

  isUpdatingOrder = false;

  private reopenDetailsAfterEdit = false;

  private editedOrderCode:
    string | null = null;

  /* =======================================================
     NOTIFICACIÓN
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

  private readonly ordersStorageKey =
    'sabor-andino-admin-orders';

  /* =======================================================
     OPCIONES
  ======================================================== */

  readonly statusOptions:
    OrderStatus[] = [
      'Pendiente',
      'Confirmado',
      'En preparación',
      'Listo',
      'En camino',
      'Entregado',
      'Cancelado'
    ];

  readonly typeOptions:
    OrderType[] = [
      'Delivery',
      'Recojo'
    ];

  readonly paymentOptions:
    PaymentType[] = [
      'Yape',
      'Tarjeta BCP',
      'Efectivo'
    ];

  branchOptions:
    string[] = [
      'Sabor Andino Miraflores - Lima',
      'Sabor Andino San Miguel - Lima',
      'Sabor Andino Abancay - Apurímac',
      'Sabor Andino Andahuaylas - Apurímac',
      'Sabor Andino Huamanga - Ayacucho',
      'Sabor Andino Huanta - Ayacucho'
    ];

  readonly quickStatusOptions:
    QuickStatusOption[] = [
      {
        label: 'Todos',
        value: '',
        icon: 'list_alt'
      },
      {
        label: 'Pendientes',
        value: 'Pendiente',
        icon: 'schedule'
      },
      {
        label: 'Confirmados',
        value: 'Confirmado',
        icon: 'check_circle'
      },
      {
        label: 'En preparación',
        value: 'En preparación',
        icon: 'skillet'
      },
      {
        label: 'Listos',
        value: 'Listo',
        icon: 'room_service'
      },
      {
        label: 'En camino',
        value: 'En camino',
        icon: 'delivery_dining'
      },
      {
        label: 'Entregados',
        value: 'Entregado',
        icon: 'task_alt'
      },
      {
        label: 'Cancelados',
        value: 'Cancelado',
        icon: 'cancel'
      }
    ];

  /* =======================================================
     FLUJOS DE ESTADO
  ======================================================== */

  private readonly deliveryFlow:
    OrderStatus[] = [
      'Pendiente',
      'Confirmado',
      'En preparación',
      'Listo',
      'En camino',
      'Entregado'
    ];

  private readonly pickupFlow:
    OrderStatus[] = [
      'Pendiente',
      'Confirmado',
      'En preparación',
      'Listo',
      'Entregado'
    ];

  /* =======================================================
     FORMULARIO DE NUEVO PEDIDO
  ======================================================== */



  /* =======================================================
     PEDIDOS
  ======================================================== */

  orders:
    OrderItem[] = [];

  /* =======================================================
     CICLO DE VIDA
  ======================================================== */

  constructor(private readonly api: SaborAndinoApiService) {}

  ngOnInit(): void {
    this.loadOrders();
    this.loadBranchOptions();
  }

  ngOnDestroy(): void {
    if (this.toastTimer) {
      clearTimeout(
        this.toastTimer
      );
    }
  }

  /* =======================================================
     INDICADORES
  ======================================================== */

  get totalOrders(): number {
    return this.orders.length;
  }

  get pendingOrders(): number {
    return this.orders.filter(
      order =>
        order.status === 'Pendiente'
    ).length;
  }

  get confirmedOrders(): number {
    return this.orders.filter(
      order =>
        order.status === 'Confirmado'
    ).length;
  }

  get inProcessOrders(): number {
    const processStatuses:
      OrderStatus[] = [
        'Confirmado',
        'En preparación',
        'Listo',
        'En camino'
      ];

    return this.orders.filter(
      order =>
        processStatuses.includes(
          order.status
        )
    ).length;
  }

  get deliveredOrders(): number {
    return this.orders.filter(
      order =>
        order.status === 'Entregado'
    ).length;
  }

  get cancelledOrders(): number {
    return this.orders.filter(
      order =>
        order.status === 'Cancelado'
    ).length;
  }

  get totalSales(): number {
    return this.orders
      .filter(
        order =>
          order.status !== 'Cancelado'
      )
      .reduce(
        (
          total,
          order
        ) =>
          total + order.total,
        0
      );
  }

  /* =======================================================
     FILTRADO
  ======================================================== */

  get filteredOrders():
    OrderItem[] {

    const searchValue =
      this.normalizeText(
        this.searchTerm
      );

    return this.orders.filter(
      order => {

        const searchableContent =
          this.normalizeText(
            [
              order.code,
              order.customerName,
              order.customerPhone,
              order.branch,
              order.payment,
              order.type,
              order.status
            ].join(' ')
          );

        const matchesSearch =
          !searchValue ||
          searchableContent.includes(
            searchValue
          );

        const matchesStatus =
          !this.selectedStatus ||
          order.status ===
            this.selectedStatus;

        const matchesType =
          !this.selectedType ||
          order.type ===
            this.selectedType;

        const matchesBranch =
          !this.selectedBranch ||
          order.branch ===
            this.selectedBranch;

        return (
          matchesSearch &&
          matchesStatus &&
          matchesType &&
          matchesBranch
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
        this.filteredOrders.length /
        this.pageSize
      )
    );
  }

  get paginatedOrders():
    OrderItem[] {

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

    return this.filteredOrders.slice(
      startIndex,
      startIndex +
      this.pageSize
    );
  }

  get showingFrom(): number {
    if (
      this.filteredOrders.length ===
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
      this.filteredOrders.length
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
     FILTROS RÁPIDOS
  ======================================================== */

  setQuickStatusFilter(
    status:
      OrderStatusFilter
  ): void {

    this.selectedStatus =
      status;

    this.currentPage = 1;
  }

  isQuickStatusActive(
    status:
      OrderStatusFilter
  ): boolean {

    return (
      this.selectedStatus ===
      status
    );
  }

  getStatusCount(
    status:
      OrderStatusFilter
  ): number {

    if (!status) {
      return this.totalOrders;
    }

    return this.orders.filter(
      order =>
        order.status === status
    ).length;
  }

  onFiltersChange(): void {
    this.currentPage = 1;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = '';
    this.selectedType = '';
    this.selectedBranch = '';

    this.currentPage = 1;
  }

  /* =======================================================
     DETALLE DEL PEDIDO
  ======================================================== */

  openOrderDetails(
    order: OrderItem
  ): void {

    this.selectedOrder =
      order;

    this.detailsModalOpen =
      true;
  }

  closeOrderDetails(): void {
    this.detailsModalOpen =
      false;

    this.selectedOrder =
      null;
  }

  /* =======================================================
     EDITAR PEDIDO
  ======================================================== */

  openEditOrderModal(
    order: OrderItem
  ): void {

    this.reopenDetailsAfterEdit =
      this.detailsModalOpen &&
      this.selectedOrder?.code ===
        order.code;

    this.editedOrderCode =
      order.code;

    this.editingOrder =
      this.cloneOrder(
        order
      );

    this.editOrderError = '';
    this.editOrderModalOpen = true;

    this.detailsModalOpen = false;
    this.selectedOrder = null;
  }

  closeEditOrderModal(): void {
    if (
      this.isUpdatingOrder
    ) {
      return;
    }

    const shouldReopenDetails =
      this.reopenDetailsAfterEdit;

    const orderCode =
      this.editedOrderCode;

    this.editOrderModalOpen =
      false;

    this.editingOrder =
      null;

    this.editOrderError = '';

    this.reopenDetailsAfterEdit =
      false;

    this.editedOrderCode =
      null;

    if (
      shouldReopenDetails &&
      orderCode
    ) {
      const currentOrder =
        this.orders.find(
          order =>
            order.code ===
            orderCode
        );

      if (currentOrder) {
        this.selectedOrder =
          currentOrder;

        this.detailsModalOpen =
          true;
      }
    }
  }

  saveEditedOrder(): void {
    if (
      this.isUpdatingOrder ||
      !this.editingOrder
    ) {
      return;
    }

    const editingOrder =
      this.editingOrder;

    const customerName =
      editingOrder.customerName
        .trim();

    const customerPhone =
      editingOrder.customerPhone
        .trim();

    const address =
      editingOrder.address
        .trim();

    const total =
      Number(
        editingOrder.total
      );

    if (
      customerName.length < 3
    ) {
      this.editOrderError =
        'Ingresa el nombre completo del cliente.';

      return;
    }

    if (
      !/^[0-9\s()+-]{7,20}$/
        .test(
          customerPhone
        )
    ) {
      this.editOrderError =
        'Ingresa un teléfono válido.';

      return;
    }

    if (
      !editingOrder.branch
    ) {
      this.editOrderError =
        'Selecciona la sucursal del pedido.';

      return;
    }

    if (
      editingOrder.type ===
        'Delivery' &&
      address.length < 5
    ) {
      this.editOrderError =
        'Ingresa una dirección de entrega válida.';

      return;
    }

    if (
      !Number.isFinite(
        total
      ) ||
      total <= 0
    ) {
      this.editOrderError =
        'Ingresa un total válido.';

      return;
    }

    const orderIndex =
      this.orders.findIndex(
        order =>
          order.code ===
          editingOrder.code
      );

    if (
      orderIndex < 0
    ) {
      this.editOrderError =
        'No se encontró el pedido que deseas editar.';

      return;
    }

    this.isUpdatingOrder =
      true;

    const currentOrder =
      this.orders[
        orderIndex
      ];

    const currentDateTime =
      this.formatCurrentDateTime();

    const updatedProducts =
      editingOrder.products.map(
        product => ({
          ...product
        })
      );

    if (
      updatedProducts.length === 1 &&
      updatedProducts[0].name ===
        'Pedido registrado manualmente'
    ) {
      updatedProducts[0].unitPrice =
        total;

      updatedProducts[0].quantity =
        1;
    }

    const updatedOrder:
      OrderItem = {

      ...currentOrder,

      customerName,

      customerPhone,

      customerInitial:
        customerName
          .charAt(0)
          .toUpperCase(),

      type:
        editingOrder.type,

      branch:
        editingOrder.branch,

      payment:
        editingOrder.payment,

      total,

      address:
        editingOrder.type ===
        'Delivery'
          ? address
          : 'Recojo en sucursal',

      reference:
        editingOrder.type ===
        'Delivery'
          ? editingOrder.reference
              .trim()
          : '',

      notes:
        editingOrder.notes
          .trim(),

      updatedAt:
        currentDateTime,

      products:
        updatedProducts,

      history: [
        ...currentOrder.history.map(
          entry => ({
            ...entry
          })
        ),
        {
          status:
            currentOrder.status,

          dateTime:
            currentDateTime,

          note:
            'Información del pedido actualizada por el administrador.'
        }
      ]
    };

    this.orders[
      orderIndex
    ] = updatedOrder;

    this.saveOrders();

    const orderCode =
      updatedOrder.code;

    const reopenDetails =
      this.reopenDetailsAfterEdit;

    this.isUpdatingOrder =
      false;

    this.editOrderModalOpen =
      false;

    this.editingOrder =
      null;

    this.editOrderError = '';

    this.reopenDetailsAfterEdit =
      false;

    this.editedOrderCode =
      null;

    if (
      reopenDetails
    ) {
      this.selectedOrder =
        updatedOrder;

      this.detailsModalOpen =
        true;
    }

    this.showToast(
      `${orderCode} fue actualizado correctamente.`,
      'success'
    );
  }

  /* =======================================================
     ESTADOS DEL PEDIDO
  ======================================================== */

  canChangeOrderStatus(
    order: OrderItem
  ): boolean {

    return ![
      'Entregado',
      'Cancelado'
    ].includes(
      order.status
    );
  }

  getNextPrimaryStatus(
    order: OrderItem
  ): OrderStatus | null {

    const flow =
      order.type ===
      'Delivery'
        ? this.deliveryFlow
        : this.pickupFlow;

    const currentIndex =
      flow.indexOf(
        order.status
      );

    if (
      currentIndex < 0 ||
      currentIndex >=
      flow.length - 1
    ) {
      return null;
    }

    return flow[
      currentIndex + 1
    ];
  }

  getNextStatusLabel(
    order: OrderItem
  ): string {

    const nextStatus =
      this.getNextPrimaryStatus(
        order
      );

    return nextStatus
      ? `Confirmar como ${nextStatus}`
      : 'Pedido finalizado';
  }

  advanceOrderStatus(
    order: OrderItem
  ): void {

    const nextStatus =
      this.getNextPrimaryStatus(
        order
      );

    if (!nextStatus) {
      this.showToast(
        'El pedido ya se encuentra finalizado.',
        'info'
      );

      return;
    }

    if (
      nextStatus ===
        'Entregado' &&
      typeof window !==
        'undefined'
    ) {
      const confirmed =
        window.confirm(
          `¿Confirmas que el pedido ${order.code} fue entregado correctamente?`
        );

      if (!confirmed) {
        return;
      }
    }

    this.updateOrderStatus(
      order,
      nextStatus
    );
  }

  private updateOrderStatus(
    order: OrderItem,
    newStatus: OrderStatus,
    customNote?: string
  ): void {

    if (
      order.status ===
      newStatus
    ) {
      return;
    }

    const previousStatus =
      order.status;

    const currentDateTime =
      this.formatCurrentDateTime();

    order.status =
      newStatus;

    order.updatedAt =
      currentDateTime;

    if (
      !Array.isArray(
        order.history
      )
    ) {
      order.history = [];
    }

    order.history.push({
      status:
        newStatus,

      dateTime:
        currentDateTime,

      note:
        customNote ??
        `Estado actualizado de ${previousStatus} a ${newStatus}.`
    });

    if (
      newStatus !==
      'Cancelado'
    ) {
      order.cancellationReason =
        undefined;
    }

    if (
      this.selectedOrder?.code ===
      order.code
    ) {
      this.selectedOrder =
        order;
    }

    this.saveOrders();

    this.showToast(
      newStatus === 'Cancelado'
        ? `${order.code} fue cancelado correctamente.`
        : `${order.code} actualizado a “${newStatus}”.`,
      'success'
    );
  }

  /* =======================================================
     CANCELAR PEDIDO
  ======================================================== */

  openCancellationModal(
    order: OrderItem
  ): void {

    if (
      !this.canChangeOrderStatus(
        order
      )
    ) {
      this.showToast(
        order.status === 'Cancelado'
          ? 'Este pedido ya se encuentra cancelado.'
          : 'Este pedido ya fue entregado y no puede cancelarse.',
        'info'
      );

      return;
    }

    this.orderPendingCancellation =
      order;

    this.cancellationReason = '';
    this.cancellationError = '';

    this.cancellationModalOpen =
      true;
  }

  closeCancellationModal(): void {
    this.cancellationModalOpen =
      false;

    this.orderPendingCancellation =
      null;

    this.cancellationReason = '';
    this.cancellationError = '';
  }

  confirmCancellation(): void {
    const order =
      this.orderPendingCancellation;

    const reason =
      this.cancellationReason
        .trim();

    if (!order) {
      this.cancellationError =
        'No se encontró el pedido que deseas cancelar.';

      return;
    }

    if (
      !this.canChangeOrderStatus(
        order
      )
    ) {
      this.closeCancellationModal();

      this.showToast(
        'El pedido ya está finalizado y no puede cancelarse.',
        'error'
      );

      return;
    }

    if (
      reason.length < 5
    ) {
      this.cancellationError =
        'Ingresa un motivo de cancelación de al menos 5 caracteres.';

      return;
    }

    order.cancellationReason =
      reason;

    this.updateOrderStatus(
      order,
      'Cancelado',
      `Pedido cancelado. Motivo: ${reason}`
    );

    this.closeCancellationModal();
  }

/* =======================================================
     IMPRIMIR COMPROBANTE
  ======================================================== */

  printOrderReceipt(
    order: OrderItem
  ): void {

    if (
      typeof window ===
      'undefined'
    ) {
      return;
    }

    const printWindow =
      window.open(
        '',
        '_blank',
        'width=820,height=900,scrollbars=yes,resizable=yes'
      );

    if (!printWindow) {
      this.showToast(
        'El navegador bloqueó la ventana del comprobante.',
        'error'
      );

      return;
    }

    const productsRows =
      order.products.length > 0
        ? order.products
            .map(
              product => {

                const subtotal =
                  this.calculateProductSubtotal(
                    product
                  );

                return `
                  <tr>
                    <td>
                      ${this.escapeHtml(product.name)}
                    </td>

                    <td class="center">
                      ${product.quantity}
                    </td>

                    <td class="right">
                      ${this.escapeHtml(
                        this.formatCurrency(
                          product.unitPrice
                        )
                      )}
                    </td>

                    <td class="right">
                      ${this.escapeHtml(
                        this.formatCurrency(
                          subtotal
                        )
                      )}
                    </td>
                  </tr>
                `;
              }
            )
            .join('')
        : `
            <tr>
              <td
                colspan="4"
                class="empty-products"
              >
                No se registraron productos.
              </td>
            </tr>
          `;

    const referenceContent =
      order.reference
        ? `
            <div class="information-row full">
              <span>
                Referencia
              </span>

              <strong>
                ${this.escapeHtml(order.reference)}
              </strong>
            </div>
          `
        : '';

    const notesContent =
      order.notes
        ? `
            <section class="receipt-notes">

              <strong>
                Indicaciones
              </strong>

              <p>
                ${this.escapeHtml(order.notes)}
              </p>

            </section>
          `
        : '';

    const cancellationContent =
      order.status ===
        'Cancelado' &&
      order.cancellationReason
        ? `
            <section class="receipt-cancellation">

              <strong>
                Motivo de cancelación
              </strong>

              <p>
                ${this.escapeHtml(
                  order.cancellationReason
                )}
              </p>

            </section>
          `
        : '';

    const logoUrl =
      `${window.location.origin}/images/logo/logo-sabor-andino.png`;

    const receiptHtml = `
      <!DOCTYPE html>

      <html lang="es">

      <head>

        <meta charset="UTF-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />

        <title>
          Comprobante ${this.escapeHtml(order.code)}
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 28px;

            background: #f4f0eb;
            color: #302823;

            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .receipt {
            width: 100%;
            max-width: 720px;
            margin: 0 auto;

            overflow: hidden;

            border:
              1px solid #e4d8ce;

            border-radius: 20px;

            background: #ffffff;

            box-shadow:
              0 18px 45px
              rgba(50, 29, 23, 0.12);
          }

          .receipt-header {
            padding: 25px 28px;

            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;

            border-bottom:
              4px solid #c89a3a;

            background:
              linear-gradient(
                135deg,
                #4b050d,
                #8b1021
              );

            color: #ffffff;
          }

          .brand {
            display: flex;
            align-items: center;
            gap: 15px;
          }

          .brand img {
            width: 72px;
            height: 72px;

            object-fit: contain;

            border-radius: 50%;

            background: #ffffff;
          }

          .brand h1 {
            margin: 0;

            font-family:
              Georgia,
              serif;

            font-size: 27px;
          }

          .brand p {
            margin: 5px 0 0;

            color:
              rgba(255, 255, 255, 0.78);

            font-size: 12px;
          }

          .receipt-code {
            text-align: right;
          }

          .receipt-code span {
            display: block;

            color:
              rgba(255, 255, 255, 0.72);

            font-size: 10px;
            letter-spacing: 1px;

            text-transform: uppercase;
          }

          .receipt-code strong {
            display: block;
            margin-top: 5px;

            font-size: 18px;
          }

          .receipt-content {
            padding: 24px 28px;
          }

          .receipt-status {
            margin-bottom: 22px;
            padding: 12px 14px;

            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 15px;

            border:
              1px solid #eaded5;

            border-radius: 12px;

            background: #faf7f4;
          }

          .receipt-status span {
            color: #8d8179;
            font-size: 11px;
          }

          .receipt-status strong {
            padding: 7px 12px;

            border-radius: 30px;

            background: #f3e7e9;
            color: #8b1021;

            font-size: 11px;
          }

          .information-grid {
            display: grid;

            grid-template-columns:
              repeat(
                2,
                minmax(0, 1fr)
              );

            gap: 12px;
          }

          .information-row {
            padding: 12px;

            display: flex;
            flex-direction: column;

            border-radius: 10px;

            background: #faf7f4;
          }

          .information-row.full {
            grid-column: 1 / -1;
          }

          .information-row span {
            color: #988c84;

            font-size: 9px;
            font-weight: 700;
            letter-spacing: 0.5px;

            text-transform: uppercase;
          }

          .information-row strong {
            margin-top: 5px;

            color: #403733;

            font-size: 12px;
            line-height: 1.4;
          }

          .products-title {
            margin: 25px 0 10px;

            color: #5a0711;

            font-family:
              Georgia,
              serif;

            font-size: 18px;
          }

          table {
            width: 100%;

            border-collapse: collapse;
          }

          th,
          td {
            padding: 11px 10px;

            border-bottom:
              1px solid #ece2da;

            font-size: 11px;

            text-align: left;
          }

          th {
            background: #f8f4ee;
            color: #74685f;

            font-size: 9px;
            letter-spacing: 0.4px;

            text-transform: uppercase;
          }

          .center {
            text-align: center;
          }

          .right {
            text-align: right;
          }

          .empty-products {
            color: #998c84;

            text-align: center;
          }

          .receipt-total {
            margin-top: 18px;
            padding: 16px 18px;

            display: flex;
            align-items: center;
            justify-content: space-between;

            border-radius: 12px;

            background:
              linear-gradient(
                135deg,
                #f7e9ec,
                #fff8f9
              );
          }

          .receipt-total span {
            color: #6f625b;

            font-size: 13px;
            font-weight: 700;
          }

          .receipt-total strong {
            color: #8b1021;

            font-family:
              Georgia,
              serif;

            font-size: 25px;
          }

          .receipt-notes,
          .receipt-cancellation {
            margin-top: 18px;
            padding: 13px 15px;

            border-radius: 10px;

            font-size: 11px;
          }

          .receipt-notes {
            border:
              1px solid #dfd5cc;

            background: #faf7f4;
            color: #625750;
          }

          .receipt-cancellation {
            border:
              1px solid #e9c9ce;

            background: #fcecef;
            color: #ac3d4d;
          }

          .receipt-notes p,
          .receipt-cancellation p {
            margin: 6px 0 0;

            line-height: 1.5;
          }

          .receipt-footer {
            padding: 18px 28px;

            border-top:
              1px solid #e9ddd4;

            background: #fcfaf7;
            color: #8d8178;

            font-size: 10px;
            line-height: 1.5;

            text-align: center;
          }

          @media print {

            body {
              padding: 0;

              background: #ffffff;
            }

            .receipt {
              max-width: none;

              border: none;
              border-radius: 0;

              box-shadow: none;
            }

            @page {
              size: A4;
              margin: 12mm;
            }

          }

          @media (max-width: 600px) {

            body {
              padding: 10px;
            }

            .receipt-header {
              align-items: flex-start;
              flex-direction: column;
            }

            .receipt-code {
              text-align: left;
            }

            .information-grid {
              grid-template-columns: 1fr;
            }

            .information-row.full {
              grid-column: auto;
            }

          }

        </style>

      </head>

      <body>

        <main class="receipt">

          <header class="receipt-header">

            <div class="brand">

              <img
                src="${logoUrl}"
                alt="Sabor Andino"
              />

              <div>

                <h1>
                  Sabor Andino
                </h1>

                <p>
                  Cocina peruana · Comprobante de pedido
                </p>

              </div>

            </div>

            <div class="receipt-code">

              <span>
                Número de pedido
              </span>

              <strong>
                ${this.escapeHtml(order.code)}
              </strong>

            </div>

          </header>

          <section class="receipt-content">

            <div class="receipt-status">

              <span>
                Estado del pedido
              </span>

              <strong>
                ${this.escapeHtml(order.status)}
              </strong>

            </div>

            <div class="information-grid">

              <div class="information-row">

                <span>
                  Cliente
                </span>

                <strong>
                  ${this.escapeHtml(order.customerName)}
                </strong>

              </div>

              <div class="information-row">

                <span>
                  Teléfono
                </span>

                <strong>
                  ${this.escapeHtml(order.customerPhone)}
                </strong>

              </div>

              <div class="information-row">

                <span>
                  Tipo de pedido
                </span>

                <strong>
                  ${this.escapeHtml(order.type)}
                </strong>

              </div>

              <div class="information-row">

                <span>
                  Método de pago
                </span>

                <strong>
                  ${this.escapeHtml(order.payment)}
                </strong>

              </div>

              <div class="information-row full">

                <span>
                  Sucursal
                </span>

                <strong>
                  ${this.escapeHtml(order.branch)}
                </strong>

              </div>

              <div class="information-row full">

                <span>
                  ${
                    order.type ===
                    'Delivery'
                      ? 'Dirección de entrega'
                      : 'Modalidad'
                  }
                </span>

                <strong>
                  ${this.escapeHtml(order.address)}
                </strong>

              </div>

              ${referenceContent}

              <div class="information-row">

                <span>
                  Fecha de registro
                </span>

                <strong>
                  ${this.escapeHtml(order.dateTime)}
                </strong>

              </div>

              <div class="information-row">

                <span>
                  Última actualización
                </span>

                <strong>
                  ${this.escapeHtml(order.updatedAt)}
                </strong>

              </div>

            </div>

            <h2 class="products-title">
              Detalle del pedido
            </h2>

            <table>

              <thead>

                <tr>
                  <th>Producto</th>
                  <th class="center">Cantidad</th>
                  <th class="right">Precio</th>
                  <th class="right">Subtotal</th>
                </tr>

              </thead>

              <tbody>
                ${productsRows}
              </tbody>

            </table>

            <div class="receipt-total">

              <span>
                Total del pedido
              </span>

              <strong>
                ${this.escapeHtml(
                  this.formatCurrency(
                    order.total
                  )
                )}
              </strong>

            </div>

            ${notesContent}

            ${cancellationContent}

          </section>

          <footer class="receipt-footer">

            Gracias por elegir Sabor Andino.

            <br />

            Este comprobante fue generado desde
            el panel administrativo.

          </footer>

        </main>

      </body>

      </html>
    `;

    printWindow.document.open();

    printWindow.document.write(
      receiptHtml
    );

    printWindow.document.close();

    printWindow.focus();

    setTimeout(
      () => {
        printWindow.print();
      },
      500
    );

    this.showToast(
      `Comprobante de ${order.code} preparado para imprimir.`,
      'success'
    );
  }

  /* =======================================================
     EXPORTAR PEDIDOS
  ======================================================== */

  exportOrders(): void {
    if (
      this.filteredOrders.length ===
      0
    ) {
      this.showToast(
        'No existen pedidos para exportar.',
        'info'
      );

      return;
    }

    const headers = [
      'Código',
      'Cliente',
      'Teléfono',
      'Tipo',
      'Sucursal',
      'Fecha y hora',
      'Pago',
      'Total',
      'Estado'
    ];

    const rows =
      this.filteredOrders.map(
        order => [
          order.code,
          order.customerName,
          order.customerPhone,
          order.type,
          order.branch,
          order.dateTime,
          order.payment,
          order.total.toFixed(2),
          order.status
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
      `pedidos-sabor-andino-${Date.now()}.csv`;

    document.body.appendChild(
      anchor
    );

    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(
      downloadUrl
    );

    this.showToast(
      'Lista de pedidos exportada correctamente.',
      'success'
    );
  }

  /* =======================================================
     CLASES E ÍCONOS
  ======================================================== */

  getTypeClass(
    type: OrderType
  ): string {

    return type ===
      'Delivery'
        ? 'type-delivery'
        : 'type-pickup';
  }

  getTypeIcon(
    type: OrderType
  ): string {

    return type ===
      'Delivery'
        ? 'delivery_dining'
        : 'shopping_bag';
  }

  getPaymentIcon(
    payment: PaymentType
  ): string {

    const icons:
      Record<PaymentType, string> = {

      Yape:
        'qr_code_2',

      'Tarjeta BCP':
        'credit_card',

      Efectivo:
        'payments'
    };

    return icons[
      payment
    ];
  }

  getStatusClass(
    status: OrderStatus
  ): string {

    const classes:
      Record<OrderStatus, string> = {

      Pendiente:
        'status-pending',

      Confirmado:
        'status-confirmed',

      'En preparación':
        'status-preparing',

      Listo:
        'status-ready',

      'En camino':
        'status-onway',

      Entregado:
        'status-delivered',

      Cancelado:
        'status-cancelled'
    };

    return classes[
      status
    ];
  }

  getStatusIcon(
    status: OrderStatus
  ): string {

    const icons:
      Record<OrderStatus, string> = {

      Pendiente:
        'schedule',

      Confirmado:
        'check_circle',

      'En preparación':
        'skillet',

      Listo:
        'room_service',

      'En camino':
        'delivery_dining',

      Entregado:
        'task_alt',

      Cancelado:
        'cancel'
    };

    return icons[
      status
    ];
  }

  /* =======================================================
     FORMATO
  ======================================================== */

  formatCurrency(
    amount: number
  ): string {

    return new Intl.NumberFormat(
      'es-PE',
      {
        style:
          'currency',

        currency:
          'PEN',

        minimumFractionDigits:
          2
      }
    ).format(
      amount
    );
  }

  calculateProductSubtotal(
    product:
      OrderProduct
  ): number {

    return (
      product.quantity *
      product.unitPrice
    );
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

  private loadOrders(): void {
    this.api.getAdminOrders<OrderItem[]>().subscribe({
      next: response => {
        this.orders = response.success && Array.isArray(response.data)
          ? response.data.map((item, index) => this.normalizeOrder(item, index))
          : [];
      },
      error: () => {
        this.orders = [];
        this.showToast('No se pudieron cargar los pedidos desde la base de datos.', 'error');
      }
    });
  }

private saveOrders(): void {
    this.api.syncOrders(this.orders).subscribe({
      next: response => {
        if (!response.success) {
          this.showToast(response.message, 'error');
          return;
        }
        this.loadOrders();
      },
      error: () => this.showToast('No se pudieron guardar los pedidos en la base de datos.', 'error')
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

  private normalizeOrder(
    order:
      Partial<OrderItem>,
    index: number
  ): OrderItem {

    const customerName =
      order.customerName
        ?.trim() ||
      'Sin nombre registrado';

    const status =
      this.isOrderStatus(
        order.status
      )
        ? order.status
        : 'Pendiente';

    const type =
      this.isOrderType(
        order.type
      )
        ? order.type
        : 'Delivery';

    const payment =
      this.isPaymentType(
        order.payment
      )
        ? order.payment
        : 'Efectivo';

    const dateTime =
      order.dateTime ||
      this.formatCurrentDateTime();

    return {
      code:
        order.code ||
        `PED-${String(
          index + 1
        ).padStart(
          6,
          '0'
        )}`,

      customerName,

      customerPhone:
        order.customerPhone ||
        '',

      customerInitial:
        order.customerInitial ||
        customerName
          .charAt(0)
          .toUpperCase(),

      type,

      branch:
        order.branch ||
        this.branchOptions[0],

      dateTime,

      updatedAt:
        order.updatedAt ||
        dateTime,

      payment,

      total:
        Number.isFinite(
          Number(
            order.total
          )
        )
          ? Number(
              order.total
            )
          : 0,

      status,

      address:
        order.address ||
        (
          type ===
          'Recojo'
            ? 'Recojo en sucursal'
            : ''
        ),

      reference:
        order.reference ||
        '',

      notes:
        order.notes ||
        '',

      products:
        this.normalizeProducts(
          order.products
        ),

      history:
        this.normalizeHistory(
          order.history,
          status,
          dateTime
        ),

      cancellationReason:
        order.cancellationReason
    };
  }

  private normalizeProducts(
    products:
      OrderProduct[] |
      undefined
  ): OrderProduct[] {

    if (
      !Array.isArray(
        products
      )
    ) {
      return [];
    }

    return products
      .filter(
        product =>
          product &&
          typeof product.name ===
            'string'
      )
      .map(
        product => ({
          name:
            product.name.trim() ||
            'Producto sin nombre',

          quantity:
            Math.max(
              1,
              Number(
                product.quantity
              ) || 1
            ),

          unitPrice:
            Math.max(
              0,
              Number(
                product.unitPrice
              ) || 0
            )
        })
      );
  }

  private normalizeHistory(
    history:
      OrderHistoryEntry[] |
      undefined,
    currentStatus:
      OrderStatus,
    dateTime:
      string
  ): OrderHistoryEntry[] {

    if (
      !Array.isArray(
        history
      ) ||
      history.length === 0
    ) {
      return [
        {
          status:
            currentStatus,

          dateTime,

          note:
            `Estado actual: ${currentStatus}.`
        }
      ];
    }

    const normalizedHistory:
      OrderHistoryEntry[] = [];

    for (
      const entry of history
    ) {
      if (
        !entry ||
        !this.isOrderStatus(
          entry.status
        )
      ) {
        continue;
      }

      const normalizedEntry:
        OrderHistoryEntry = {

        status:
          entry.status,

        dateTime:
          entry.dateTime ||
          dateTime,

        note:
          entry.note ||
          `Estado actualizado a ${entry.status}.`
      };

      const previousEntry =
        normalizedHistory[
          normalizedHistory.length - 1
        ];

      const isDuplicate =
        Boolean(
          previousEntry &&
          previousEntry.status ===
            normalizedEntry.status &&
          previousEntry.dateTime ===
            normalizedEntry.dateTime &&
          previousEntry.note ===
            normalizedEntry.note
        );

      if (!isDuplicate) {
        normalizedHistory.push(
          normalizedEntry
        );
      }
    }

    return normalizedHistory.length > 0
      ? normalizedHistory
      : [
          {
            status:
              currentStatus,

            dateTime,

            note:
              `Estado actual: ${currentStatus}.`
          }
        ];
  }

  /* =======================================================
     UTILIDADES
  ======================================================== */

private cloneOrder(
    order: OrderItem
  ): OrderItem {

    return {
      ...order,

      products:
        order.products.map(
          product => ({
            ...product
          })
        ),

      history:
        order.history.map(
          entry => ({
            ...entry
          })
        )
    };
  }

  private generateNextOrderCode():
    string {

    const highestNumber =
      this.orders.reduce(
        (
          maximum,
          order
        ) => {

          const numericPart =
            Number(
              order.code.replace(
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
      `PED-${String(
        highestNumber + 1
      ).padStart(
        6,
        '0'
      )}`
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

  private escapeHtml(
    value: string
  ): string {

    return value
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      )
      .replace(
        /"/g,
        '&quot;'
      )
      .replace(
        /'/g,
        '&#039;'
      );
  }

  private isOrderStatus(
    value: unknown
  ): value is OrderStatus {

    return this.statusOptions.includes(
      value as OrderStatus
    );
  }

  private isOrderType(
    value: unknown
  ): value is OrderType {

    return this.typeOptions.includes(
      value as OrderType
    );
  }

  private isPaymentType(
    value: unknown
  ): value is PaymentType {

    return this.paymentOptions.includes(
      value as PaymentType
    );
  }

}