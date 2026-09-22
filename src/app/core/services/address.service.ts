import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Address } from '../models/address.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AddressService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private apiUrl = 'http://localhost:3000/addresses';

  getAddresses(): Observable<Address[]> {
    const userId = this.authService.getCurrentUserId();
    return this.http.get<Address[]>(`${this.apiUrl}?userId=${userId}`);
  }

  addAddress(address: Address): Observable<Address> {
    const userId = this.authService.getCurrentUserId();
    return this.http.post<Address>(this.apiUrl, { ...address, userId });
  }

  updateAddress(id: number | string, address: Partial<Address>): Observable<Address> {
    return this.http.patch<Address>(`${this.apiUrl}/${id}`, address);
  }

  deleteAddress(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
