import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { Order } from '../../core/models/order.model';


@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {

  private orderService = inject(OrderService);
  private snackbar = inject(SnackbarService);

  orders: Order[] = [];
  loading = true;
  expandedOrderId: number | string | null = null;

  ngOnInit() {
    this.loading = true;
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
      case 'delivered': return 'bg-[#FCE7EF] text-[#9D174D]';
      case 'shipped': return 'bg-[#FCE7EF] text-[#BE185D]';
      case 'processing': return 'bg-[#FFF5F7] text-[#D24F82]';
      case 'cancelled': return 'bg-[#FFF1F3] text-[#C6284F]';
      default: return 'bg-[#FCE7EF] text-[#765662]';
    }
  }
}
