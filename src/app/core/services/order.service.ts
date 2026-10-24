import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map, switchMap, throwError } from 'rxjs';
import { ItemStatus, Order, deriveOrderStatus, itemStatusOf } from '../models/order.model';
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

  // ---------- Cancel / return (whole order or single products) ----------

  cancelOrder(id: number | string, reason: string): Observable<Order> {
    return this.changeItems(id, null, 'cancel', reason);
  }

  cancelItem(id: number | string, itemIndex: number, reason: string): Observable<Order> {
    return this.changeItems(id, [itemIndex], 'cancel', reason);
  }

  requestReturn(id: number | string, reason: string): Observable<Order> {
    return this.changeItems(id, null, 'return', reason);
  }

  returnItem(id: number | string, itemIndex: number, reason: string): Observable<Order> {
    return this.changeItems(id, [itemIndex], 'return', reason);
  }

  /**
   * Cancels or returns the chosen products (null = every product still active).
   * The latest order is fetched first, so an order the admin has just shipped
   * can no longer be cancelled.
   */
  private changeItems(
    id: number | string,
    indexes: number[] | null,
    action: 'cancel' | 'return',
    reason: string
  ): Observable<Order> {

    const errorCode = action === 'cancel' ? 'NOT_CANCELLABLE' : 'NOT_RETURNABLE';
    const allowedOrderStatus = action === 'cancel' ? ['placed', 'processing'] : ['delivered'];

    return this.getOrderById(id).pipe(
      switchMap(order => {

        if (!allowedOrderStatus.includes(order.status)) {
          return throwError(() => new Error(errorCode));
        }

        // Write every item's status down explicitly (older orders only had an order status)
        const items = order.items.map(item => ({ ...item, itemStatus: itemStatusOf(order, item) }));

        const targets = (indexes ?? items.map((_, i) => i))
          .filter(i => items[i]?.itemStatus === 'active');

        if (targets.length === 0) {
          return throwError(() => new Error(errorCode));
        }

        const now = new Date().toISOString();
        const newStatus: ItemStatus = action === 'cancel' ? 'cancelled' : 'return requested';

        const updatedItems = items.map((item, i) =>
          targets.includes(i)
            ? { ...item, itemStatus: newStatus, itemReason: reason, itemUpdatedAt: now }
            : item
        );

        const status = deriveOrderStatus({ ...order, items: updatedItems });

        const patch: Partial<Order> = { items: updatedItems, status };

        if (status === 'cancelled') {
          patch.cancelReason = reason;
          patch.cancelledAt = now;
        }

        if (status === 'return requested') {
          patch.returnReason = reason;
          patch.returnRequestedAt = now;
        }

        return this.http.patch<Order>(`${this.apiUrl}/${id}`, patch);
      })
    );
  }

  /** Admin: move ONE returned product forward (return requested -> returned -> refunded). */
  updateItemStatus(id: number | string, itemIndex: number, next: 'returned' | 'refunded'): Observable<Order> {

    const expected: ItemStatus = next === 'returned' ? 'return requested' : 'returned';

    return this.getOrderById(id).pipe(
      switchMap(order => {

        const items = order.items.map(item => ({ ...item, itemStatus: itemStatusOf(order, item) }));

        if (items[itemIndex]?.itemStatus !== expected) {
          return throwError(() => new Error('INVALID_STATE'));
        }

        const updatedItems = items.map((item, i) =>
          i === itemIndex
            ? { ...item, itemStatus: next as ItemStatus, itemUpdatedAt: new Date().toISOString() }
            : item
        );

        const status = deriveOrderStatus({ ...order, items: updatedItems });

        return this.http.patch<Order>(`${this.apiUrl}/${id}`, { items: updatedItems, status });
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