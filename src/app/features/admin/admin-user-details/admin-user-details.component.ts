import { Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { User } from '../../../core/models/user.model';
import { Order } from '../../../core/models/order.model';
import { Address } from '../../../core/models/address.model';
import { CartItem } from '../../../core/models/cart.model';
import { WishlistItem } from '../../../core/models/wishlist.model';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

/**
 * Admin -> Users -> View. Shows one customer's profile together with
 * their addresses, orders, cart and wishlist.
 */
@Component({
  selector: 'app-admin-user-details',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink,PaginationComponent],
  templateUrl: './admin-user-details.component.html',
  styleUrl: './admin-user-details.component.css'
})
export class AdminUserDetailsComponent implements OnInit {

  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  private baseUrl = 'http://localhost:3000';

  user: User | null = null;
  orders: Order[] = [];
  addresses: Address[] = [];
  cartItems: CartItem[] = [];
  wishlistItems: WishlistItem[] = [];

  loading = true;
  notFound = false;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');

      if (!id) {
        this.loading = false;
        this.notFound = true;
        return;
      }

      this.load(id);
    });
  }

  private load(id: string) {

    this.loading = true;
    this.notFound = false;

    forkJoin({
      user: this.http.get<User>(`${this.baseUrl}/users/${id}`),
      orders: this.http.get<Order[]>(`${this.baseUrl}/orders?userId=${id}`).pipe(catchError(() => of([] as Order[]))),
      addresses: this.http.get<Address[]>(`${this.baseUrl}/addresses?userId=${id}`).pipe(catchError(() => of([] as Address[]))),
      cartItems: this.http.get<CartItem[]>(`${this.baseUrl}/cartItem?userId=${id}`).pipe(catchError(() => of([] as CartItem[]))),
      wishlistItems: this.http.get<WishlistItem[]>(`${this.baseUrl}/wishlist?userId=${id}`).pipe(catchError(() => of([] as WishlistItem[])))
    }).subscribe({
      next: data => {
        this.user = data.user;
        this.orders = [...data.orders].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.addresses = data.addresses;
        this.cartItems = data.cartItems;
        this.wishlistItems = data.wishlistItems;
        this.loading = false;
      },
      error: () => {
        // The user itself could not be loaded (deleted or wrong id)
        this.user = null;
        this.loading = false;
        this.notFound = true;
      }
    });
  }

  /** Money spent on orders that were not cancelled. */
  get totalSpent(): number {
    return this.orders
        .filter(order => order.status !== 'cancelled' && order.status !== 'refunded')
      .reduce((sum, order) => sum + order.total, 0);
  }

  paymentLabel(method: Order['paymentMethod']): string {
    switch (method) {
      case 'cod': return 'Cash on Delivery';
      case 'card': return 'Card';
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