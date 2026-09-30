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

  
  getOrders(): Observable<Order[]> {
  const userId = this.authService.getCurrentUserId();
  
  return this.http.get<Order[]>(`${this.apiUrl}?userId=${userId}&_sort=-createdAt`);
}

  placeOrder(order: Order): Observable<Order> {
    const userId = this.authService.getCurrentUserId();
    return this.http.post<Order>(this.apiUrl, { ...order, userId });
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
