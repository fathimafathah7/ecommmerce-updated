import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Opposite of authGuard: blocks /auth for anyone already signed in,
 * so a logged-in user can never land back on the login/register form
 * — not via the back button, not by typing the URL, not by a stale
 * bookmark. Sends them to the home page instead.
 */
export const guestGuard: CanActivateFn = () => {

  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return router.createUrlTree(['/']);
  }

  return true;
};