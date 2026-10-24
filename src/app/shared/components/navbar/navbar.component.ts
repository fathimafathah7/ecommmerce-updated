import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';


import { AuthService } from '../../../core/services/auth.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { selectCartItemCount } from '../../../store/cart/cart.selector';
import { selectWishlistCount } from '../../../store/wishlist/wishlist.selector';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, AsyncPipe, FormsModule,ConfirmDialogComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  private authService = inject(AuthService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  private store = inject(Store);
  private elementRef = inject(ElementRef);

  currentUser$ = this.authService.currentUser$;
  cartCount$ = this.store.select(selectCartItemCount);
  wishlistCount$ = this.store.select(selectWishlistCount);

  logoutConfirm=false
  searchTerm = '';
  accountMenuOpen = false;
  mobileMenuOpen = false;

  get loggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  toggleAccountMenu() {
    this.accountMenuOpen = !this.accountMenuOpen;
  }

  closeAccountMenu() {
    this.accountMenuOpen = false;
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  // Close the account dropdown when clicking anywhere outside the navbar.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.accountMenuOpen = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.accountMenuOpen = false;
  }

  search() {
    const term = this.searchTerm.trim();

    this.router.navigate(['/products'], {
      queryParams: { search: term || null }
    });

    this.mobileMenuOpen = false;
  }
  askLogout(){
    this.logoutConfirm=true
  }
  cancelLogout(){
    this.logoutConfirm=false
  }

  logout() {
    this.logoutConfirm=false
    const name = this.authService.getCurrentUser()?.name;
    this.authService.logout();
    this.snackbar.info(name ? `Goodbye, ${name}!` : 'You have been logged out.');
    this.accountMenuOpen = false;
    this.router.navigate(['/auth'],{replaceUrl:true});
  }
}
