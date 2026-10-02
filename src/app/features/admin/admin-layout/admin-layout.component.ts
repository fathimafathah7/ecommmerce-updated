import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SnackbarService } from '../../../core/services/snackbar.service';

/**
 * Shell for the whole admin area: a fixed sidebar + top bar wrapping a
 * <router-outlet> for the admin child routes. Deliberately has no
 * dependency on the storefront's <app-navbar>/<app-footer> — it's a
 * separate layout entirely, matching how AppComponent hides the
 * storefront chrome for any /admin/** route.
 */
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {

  private authService = inject(AuthService);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);

  adminName = this.authService.getCurrentUser()?.name ?? 'Admin';

  navLinks = [
    { path: '/admin/dashboard', label: 'Dashboard' },
    { path: '/admin/products', label: 'Products' },
    { path: '/admin/orders', label: 'Orders' },
    { path: '/admin/users', label: 'Users' }
  ];

 

  logout() {
    this.authService.logout();
    this.snackbar.success('Logged out successfully.');
    this.router.navigate(['/auth'], { replaceUrl:true});
  }
}
