import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { User } from '../../../core/models/user.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, RouterLink, ConfirmDialogComponent, PaginationComponent],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {

  private authService = inject(AuthService);
  private snackbar = inject(SnackbarService);

  users: User[] = [];
  loading = true;
  searchTerm = '';

  userPendingDeactivate: User | null = null;

  currentUserId = this.authService.getCurrentUserId();

  ngOnInit() {
    this.loading = true;
    this.authService.getUsers().subscribe({
      next: users => {
        this.users = users;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackbar.error('Could not load users.');
      }
    });
  }

  // ---------- Pagination ----------

  readonly pageSize = 10;
  page = 1;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
  }

  /** Current page, never beyond the last page (e.g. after a delete or a filter). */
  get currentPage(): number {
    return Math.min(this.page, this.totalPages);
  }

  get pagedUsers(): User[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  goToPage(page: number) {
    this.page = page;
  }

  get filteredUsers(): User[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.users;
    }
    return this.users.filter(u =>
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
  }

  isActive(user: User): boolean {
    // Accounts created before this feature have no flag, so they count as active
    return user.isActive !== false;
  }

  askDeactivate(user: User) {

    if (user.id === this.currentUserId) {
      this.snackbar.warning('You cannot deactivate your own admin account.');
      return;
    }

    this.userPendingDeactivate = user;
  }

  cancelDeactivate() {
    this.userPendingDeactivate = null;
  }

  confirmDeactivate() {

    if (!this.userPendingDeactivate) {
      return;
    }

    const user = this.userPendingDeactivate;
    this.userPendingDeactivate = null;

    this.setActive(user, false);
  }

  activate(user: User) {
    this.setActive(user, true);
  }

  /** Only the isActive flag changes - the user's data is never erased. */
  private setActive(user: User, isActive: boolean) {

    this.authService.setUserActive(user.id!, isActive).subscribe({
      next: () => {
        user.isActive = isActive;
        this.snackbar.info(
          isActive
            ? `${user.name}'s account has been activated.`
            : `${user.name}'s account has been deactivated.`
        );
      },
      error: () => {
        this.snackbar.error('Could not update this account. Please try again.');
      }
    });
  }
}