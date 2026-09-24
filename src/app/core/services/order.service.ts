import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Order } from '../models/order.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private apiUrl = 'http://localhost:3000/orders';

  /** Only ever returns orders that belong to the signed-in user. */
  getOrders(): Observable<Order[]> {
  const userId = this.authService.getCurrentUserId();
  // json-server v1 dropped `_order` — descending sort is now expressed
  // with a leading "-" directly on the _sort field.
  return this.http.get<Order[]>(`${this.apiUrl}?userId=${userId}&_sort=-createdAt`);
}

  placeOrder(order: Order): Observable<Order> {
    const userId = this.authService.getCurrentUserId();
    return this.http.post<Order>(this.apiUrl, { ...order, userId });
  }
}
