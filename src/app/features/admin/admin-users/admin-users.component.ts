import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { User } from '../../../core/models/user.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, ConfirmDialogComponent],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css'
})
export class AdminUsersComponent implements OnInit {

  private authService = inject(AuthService);
  private snackbar = inject(SnackbarService);

  users: User[] = [];
  loading = true;
  searchTerm = '';

  userPendingDelete: User | null = null;

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

  askDelete(user: User) {

    if (user.id === this.currentUserId) {
      this.snackbar.warning('You cannot delete your own admin account.');
      return;
    }

    this.userPendingDelete = user;
  }

  cancelDelete() {
    this.userPendingDelete = null;
  }

  confirmDelete() {

    if (!this.userPendingDelete) {
      return;
    }

    const id = this.userPendingDelete.id!;

    this.authService.deleteUser(id).subscribe({
      next: () => {
        this.users = this.users.filter(u => u.id !== id);
        this.snackbar.info('User account deleted.');
        this.userPendingDelete = null;
      },
      error: () => {
        this.snackbar.error('Could not delete this user.');
        this.userPendingDelete = null;
      }
    });
  }
}