import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { Order } from '../../core/models/order.model';

/**
 * Shown right after "Place order": confirms the order, shows the expected
 * delivery window and where the order is in its journey.
 */
@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './order-success.component.html',
  styleUrl: './order-success.component.css'
})
export class OrderSuccessComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);

  order: Order | null = null;
  loading = true;

  readonly steps = [
    { key: 'placed',     title: 'Order placed', text: 'We have received your order.' },
    { key: 'processing', title: 'Processing',   text: 'Your items are being packed.' },
    { key: 'shipped',    title: 'Shipped',      text: 'On its way to you.' },
    { key: 'delivered',  title: 'Delivered',    text: 'Arrives at your door.' }
  ];

  ngOnInit() {

    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.router.navigate(['/orders']);
      return;
    }

    this.orderService.getOrderById(id).subscribe({
      next: order => {

        // Only the person who placed the order may see this page
        if (String(order.userId) !== String(this.authService.getCurrentUserId())) {
          this.router.navigate(['/orders']);
          return;
        }

        this.order = order;
        this.loading = false;
      },
      error: () => {
        this.router.navigate(['/orders']);
      }
    });
  }

  get firstName(): string {
    return (this.order?.address.fullName ?? '').trim().split(' ')[0];
  }

  /** How far the order has travelled: 0 = placed ... 3 = delivered. */
  get progressIndex(): number {
    const index = this.steps.findIndex(step => step.key === this.order?.status);
    return index === -1 ? 0 : index;
  }

  get estimatedFrom(): Date {
    return this.addDays(3);
  }

  get estimatedTo(): Date {
    return this.addDays(5);
  }

  private addDays(days: number): Date {
    const date = new Date(this.order?.createdAt ?? Date.now());
    date.setDate(date.getDate() + days);
    return date;
  }

  paymentLabel(method: Order['paymentMethod']): string {
    switch (method) {
      case 'cod': return 'Cash on Delivery';
      case 'card': return 'Credit / Debit Card';
      case 'upi': return 'UPI';
      default: return method;
    }
  }
}