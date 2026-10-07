import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, PaginationComponent],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.css'
})
export class AdminOrdersComponent implements OnInit {

  private orderService = inject(OrderService);
  private snackbar = inject(SnackbarService);

  orders: Order[] = [];
  loading = true;
  expandedOrderId: number | string | null = null;
  statusFilter = '';

  statusOptions: Order['status'][] = [
    'placed', 'processing', 'shipped', 'delivered', 'cancelled',
    'return requested', 'returned', 'refunded'
  ];

  ngOnInit() {
    this.loading = true;
    this.orderService.getAllOrders().subscribe({
      next: orders => {
        this.orders = orders;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackbar.error('Could not load orders.');
      }
    });
  }

  // ---------- Pagination ----------

  readonly pageSize = 6;
  page = 1;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredOrders.length / this.pageSize));
  }

  /** Current page, never beyond the last page (e.g. after a delete or a filter). */
  get currentPage(): number {
    return Math.min(this.page, this.totalPages);
  }

  get pagedOrders(): Order[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    this.page = page;
  }

  get filteredOrders(): Order[] {
    if (!this.statusFilter) {
      return this.orders;
    }
    return this.orders.filter(o => o.status === this.statusFilter);
  }

  toggleExpand(order: Order) {
    this.expandedOrderId = this.expandedOrderId === order.id ? null : order.id!;
  }

  /**
   * The ONLY steps allowed from each status - one step at a time, no skipping.
   * "return requested" is set by the customer, never by the admin.
   */
  private readonly allowedNext: Record<Order['status'], Order['status'][]> = {
    'placed': ['processing', 'cancelled'],
    'processing': ['shipped', 'cancelled'],
    'shipped': ['delivered'],
    'delivered': [],
    'cancelled': [],
    'return requested': ['returned'],
    'returned': ['refunded'],
    'refunded': []
  };

  /** Nothing more can be changed for these orders. */
  isFinal(order: Order): boolean {
    return this.allowedNext[order.status].length === 0;
  }

  /** The current status stays selectable; every other option must be the next step. */
  canMoveTo(order: Order, target: Order['status']): boolean {
    return target === order.status || this.allowedNext[order.status].includes(target);
  }

  /** Small help text under the status dropdown. */
  statusHint(order: Order): string {
    switch (order.status) {
      case 'placed': return 'Next step: processing. You can also cancel this order.';
      case 'processing': return 'Next step: shipped. You can also cancel this order.';
      case 'shipped': return 'Next step: delivered. A shipped order can no longer be cancelled.';
      case 'delivered': return 'Delivered. The customer can still request a return.';
      case 'cancelled': return 'This order was cancelled and can no longer be changed.';
      case 'return requested': return 'Customer requested a return. Next step: mark it as returned once you receive the item.';
      case 'returned': return 'Item received. Next step: refunded, after the money is sent back.';
      case 'refunded': return 'Refund completed - this order is closed.';
      default: return '';
    }
  }

  updateStatus(order: Order, status: Order['status']) {

    if (status === order.status) {
      return;
    }

    if (!this.canMoveTo(order, status)) {
      this.snackbar.warning('Please choose the next step of this order.');
      return;
    }

    const previousStatus = order.status;
    order.status = status; // optimistic update for snappy UI

    this.orderService.updateOrderStatus(order.id!, status).subscribe({
      next: () => {
        this.snackbar.success(`Order #${order.orderNumber ?? order.id?.toString().slice(-6)} marked as ${status}.`);
      },
      error: () => {
        order.status = previousStatus;
        this.snackbar.error('Could not update the order status.');
      }
    });
  }

  paymentLabel(method: Order['paymentMethod']): string {
    switch (method) {
      case 'cod': return 'Cash on Delivery';
      case 'card': return 'Credit / Debit Card';
      case 'upi': return 'UPI';
      default: return method;
    }
  }

  statusBadgeClass(status: Order['status']): string {
    switch (status) {
      case 'delivered': return 'bg-green-50 text-green-700';
      case 'shipped': return 'bg-blue-50 text-blue-700';
      case 'processing': return 'bg-amber-50 text-amber-700';
      case 'cancelled': return 'bg-red-50 text-red-700';
      case 'return requested': return 'bg-orange-50 text-orange-700';
      case 'returned': return 'bg-purple-50 text-purple-700';
      case 'refunded': return 'bg-slate-100 text-slate-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}