import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { Order } from '../../core/models/order.model';
import { ReasonDialogComponent } from '../../shared/components/reason-dialog/reason-dialog.component';


@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink, ReasonDialogComponent],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {

  private orderService = inject(OrderService);
  private snackbar = inject(SnackbarService);

  orders: Order[] = [];
  loading = true;
  expandedOrderId: number | string | null = null;

  // Order waiting for the customer to pick a cancel / return reason
  orderToCancel: Order | null = null;
  orderToReturn: Order | null = null;

  readonly cancelReasons = [
    'Ordered by mistake',
    'Found a better price elsewhere',
    'Delivery is taking too long',
    'Want to change the address or items'
  ];

  readonly returnReasons = [
    'Product is damaged or defective',
    'Received the wrong item',
    'Product is not as described',
    'No longer needed'
  ];

  ngOnInit() {
    this.loadOrders(true);
  }

  private loadOrders(showLoader: boolean) {
    this.loading = showLoader;
    this.orderService.getOrders().subscribe({
      next: orders => {
        this.orders = orders;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackbar.error('Could not load your orders.');
      }
    });
  }

  // ---------- Cancel / return ----------

  canCancel(order: Order): boolean {
    return order.status === 'placed' || order.status === 'processing';
  }

  canReturn(order: Order): boolean {
    return order.status === 'delivered';
  }

  askCancel(order: Order) {
    this.orderToCancel = order;
  }

  askReturn(order: Order) {
    this.orderToReturn = order;
  }

  confirmCancel(reason: string) {

    const order = this.orderToCancel;
    this.orderToCancel = null;

    if (!order?.id) {
      return;
    }

    this.orderService.cancelOrder(order.id, reason).subscribe({
      next: updated => {
        this.replaceOrder(updated);
        this.snackbar.success('Your order has been cancelled.');
      },
      error: err => {
        this.snackbar.error(
          err?.message === 'NOT_CANCELLABLE'
            ? 'This order can no longer be cancelled - it has already been shipped.'
            : 'Could not cancel the order. Please try again.'
        );
        this.loadOrders(false);
      }
    });
  }

  confirmReturn(reason: string) {

    const order = this.orderToReturn;
    this.orderToReturn = null;

    if (!order?.id) {
      return;
    }

    this.orderService.requestReturn(order.id, reason).subscribe({
      next: updated => {
        this.replaceOrder(updated);
        this.snackbar.success('Return requested. We will update you once it is processed.');
      },
      error: err => {
        this.snackbar.error(
          err?.message === 'NOT_RETURNABLE'
            ? 'This order is not eligible for a return.'
            : 'Could not request the return. Please try again.'
        );
        this.loadOrders(false);
      }
    });
  }

  private replaceOrder(updated: Order) {
    this.orders = this.orders.map(o => o.id === updated.id ? updated : o);
  }

  toggleExpand(order: Order) {
    this.expandedOrderId = this.expandedOrderId === order.id ? null : order.id!;
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
  case 'delivered': return 'bg-green-100 text-green-700';
  case 'shipped': return 'bg-blue-100 text-blue-700';
  case 'processing': return 'bg-yellow-100 text-yellow-700';
  case 'cancelled': return 'bg-red-100 text-red-700';
  case 'return requested': return 'bg-orange-100 text-orange-700';
  case 'returned': return 'bg-purple-100 text-purple-700';
  case 'refunded': return 'bg-slate-200 text-slate-700';
  default: return 'bg-gray-100 text-gray-700';
}
  }
}