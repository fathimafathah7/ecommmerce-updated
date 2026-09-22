import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models/user.model';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/users';

  // Reactive current-user state so components (navbar, guards, etc.)
  // update immediately on login/logout without needing a page reload.
  private currentUserSubject = new BehaviorSubject<User | null>(
    this.readUserFromStorage()
  );

  currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  private readUserFromStorage(): User | null {
    const raw = localStorage.getItem('user');
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  register(user: User): Observable<User> {
    return this.http.post<User>(
      this.apiUrl,
      user
    );
  }

  login(
    email: string,
    password: string
  ): Observable<User[]> {

    return this.http.get<User[]>(
      `${this.apiUrl}?email=${email}&password=${password}`
    );
  }

  /** Persist the logged-in user and broadcast the change. */
  setCurrentUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): number | string | null {
    return this.currentUserSubject.value?.id ?? null;
  }

  logout(): void {
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }
}
