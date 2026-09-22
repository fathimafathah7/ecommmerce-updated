import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

/**
 * Central place for all toast / snackbar notifications in the app.
 * Every user-facing action (cart, wishlist, auth, checkout, etc.)
 * should report its outcome through this service so feedback is
 * consistent across the whole application.
 */
@Injectable({
  providedIn: 'root'
})
export class SnackbarService {

  private snackBar = inject(MatSnackBar);

  private defaultConfig: MatSnackBarConfig = {
    duration: 2800,
    horizontalPosition: 'right',
    verticalPosition: 'top'
  };

  private show(message: string, panelClass: string, duration?: number): void {
    this.snackBar.open(message, 'Close', {
      ...this.defaultConfig,
      duration: duration ?? this.defaultConfig.duration,
      panelClass: ['app-snackbar', panelClass]
    });
  }

  success(message: string): void {
    this.show(message, 'app-snackbar-success');
  }

  error(message: string): void {
    this.show(message, 'app-snackbar-error', 3500);
  }

  info(message: string): void {
    this.show(message, 'app-snackbar-info');
  }

  warning(message: string): void {
    this.show(message, 'app-snackbar-warning', 3200);
  }
}
