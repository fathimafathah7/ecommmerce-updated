import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SnackbarService } from '../services/snackbar.service';

/**
 * Protects every /admin/** route. Not logged in -> bounce to /auth.
 * Logged in but not an admin -> bounce to the storefront home with a
 * warning, rather than exposing that /admin exists at all.
 */
export const adminGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);
  const snackbar = inject(SnackbarService);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/auth']);
  }

  if (!authService.isAdmin()) {
    snackbar.error('You do not have access to the admin area.');
    return router.createUrlTree(['/']);
  }

  return true;
};