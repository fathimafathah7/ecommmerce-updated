import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private http = inject(HttpClient);

  private apiUrl = "http://localhost:3000/products";

  /**
   * All products, newest first. Products without a createdAt (the ones that
   * existed before) keep their original order after the new ones.
   */
  getProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.apiUrl).pipe(
      map(products => {
        const time = (p: Product) => p.createdAt ? new Date(p.createdAt).getTime() : 0;
        return [...products].sort((a, b) => time(b) - time(a));
      })
    );
  }

  getProductById(id: number | string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }
   addProduct(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }
 
  updateProduct(id: number | string, product: Partial<Product>): Observable<Product> {
    return this.http.patch<Product>(`${this.apiUrl}/${id}`, product);
  }
 
  deleteProduct(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}