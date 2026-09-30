import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CartItem } from '../models/cart.model';
import { AuthService } from './auth.service';


@Injectable({
  providedIn: 'root'
})
export class CartService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private apiUrl = 'http://localhost:3000/cartItem';

  
  getCart(): Observable<CartItem[]> {
    const userId = this.authService.getCurrentUserId();
    return this.http.get<CartItem[]>(`${this.apiUrl}?userId=${userId}`);
  }

  addToCart(item: CartItem): Observable<CartItem> {
    const userId = this.authService.getCurrentUserId();
    return this.http.post<CartItem>(this.apiUrl, { ...item, userId });
  }

  updateQuantity(id: number | string, quantity: number): Observable<CartItem> {
    return this.http.patch<CartItem>(
      `${this.apiUrl}/${id}`,
      { quantity }
    );
  }

  removeFromCart(id: number | string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}
