import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule],
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
    'placed', 'processing', 'shipped', 'delivered', 'cancelled'
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

  get filteredOrders(): Order[] {
    if (!this.statusFilter) {
      return this.orders;
    }
    return this.orders.filter(o => o.status === this.statusFilter);
  }

  toggleExpand(order: Order) {
    this.expandedOrderId = this.expandedOrderId === order.id ? null : order.id!;
  }

  updateStatus(order: Order, status: Order['status']) {

    if (status === order.status) {
      return;
    }

    const previousStatus = order.status;
    order.status = status; // optimistic update for snappy UI

    this.orderService.updateOrderStatus(order.id!, status).subscribe({
      next: () => {
        this.snackbar.success(`Order #${order.id?.toString().slice(-6)} marked as ${status}.`);
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
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}