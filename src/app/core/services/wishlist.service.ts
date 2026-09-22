import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WishlistItem } from '../models/wishlist.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private apiUrl = 'http://localhost:3000/wishlist';

  /** Wishlist items are scoped to the current user, same as the cart. */
  getWishlist(): Observable<WishlistItem[]> {
    const userId = this.authService.getCurrentUserId();
    return this.http.get<WishlistItem[]>(`${this.apiUrl}?userId=${userId}`);
  }

  addToWishlist(item: WishlistItem): Observable<WishlistItem> {
    const userId = this.authService.getCurrentUserId();
    return this.http.post<WishlistItem>(
      this.apiUrl,
      { ...item, userId }
    );
  }

  removeFromWishlist(id: number | string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }
}
