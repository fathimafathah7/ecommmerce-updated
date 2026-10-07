import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map, switchMap, throwError } from 'rxjs';
import { Order } from '../models/order.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private apiUrl = 'http://localhost:3000/orders';

  
  getOrders(): Observable<Order[]> {
  const userId = this.authService.getCurrentUserId();
  
  return this.http.get<Order[]>(`${this.apiUrl}?userId=${userId}&_sort=-createdAt`);
}

  /**
   * Places an order with a sequential order number (1, 2, 3 ...).
   * json-server generates its own random "id", so the readable number
   * is stored in a separate field: orderNumber.
   */
  placeOrder(order: Order): Observable<Order> {
    const userId = this.authService.getCurrentUserId();

    return this.http.get<Order[]>(this.apiUrl).pipe(
      map(orders => {
        const numbers = orders
          .map(o => Number(o.orderNumber))
          .filter(n => Number.isInteger(n) && n > 0);

        return numbers.length ? Math.max(...numbers) + 1 : 1;
      }),
      switchMap(nextNumber =>
        this.http.post<Order>(this.apiUrl, { ...order, userId, orderNumber: nextNumber })
      )
    );
  }
  getOrderById(id: number | string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`);
  }

  /**
   * Customer cancels an order. The latest status is checked first, so an order
   * that the admin has just shipped can no longer be cancelled.
   */
  cancelOrder(id: number | string, reason: string): Observable<Order> {
    return this.getOrderById(id).pipe(
      switchMap(order => {
        if (order.status !== 'placed' && order.status !== 'processing') {
          return throwError(() => new Error('NOT_CANCELLABLE'));
        }

        return this.http.patch<Order>(`${this.apiUrl}/${id}`, {
          status: 'cancelled',
          cancelReason: reason,
          cancelledAt: new Date().toISOString()
        });
      })
    );
  }

  /** Customer asks to return a delivered order. */
  requestReturn(id: number | string, reason: string): Observable<Order> {
    return this.getOrderById(id).pipe(
      switchMap(order => {
        if (order.status !== 'delivered') {
          return throwError(() => new Error('NOT_RETURNABLE'));
        }

        return this.http.patch<Order>(`${this.apiUrl}/${id}`, {
          status: 'return requested',
          returnReason: reason,
          returnRequestedAt: new Date().toISOString()
        });
      })
    );
  }

  // --- Admin-only ---
 
  /** Every order, across every user — for the admin orders page. */
  getAllOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}?_sort=-createdAt`);
  }
 
  updateOrderStatus(id: number | string, status: Order['status']): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${id}`, { status });
  }
}