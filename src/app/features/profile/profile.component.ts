import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { AddressService } from '../../core/services/address.service';
import { OrderService } from '../../core/services/order.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { Address } from '../../core/models/address.model';
import { Order } from '../../core/models/order.model';
import { User } from '../../core/models/user.model';
import { AddressFormComponent } from '../../shared/components/address-form/address-form.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

/**
 * Shows the signed-in user's details, their saved addresses (full
 * add/edit/delete management), and a lightweight "recent activity"
 * summary built from their most recent orders.
 */
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [RouterLink, DatePipe, AddressFormComponent, ConfirmDialogComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {

  private authService = inject(AuthService);
  private addressService = inject(AddressService);
  private orderService = inject(OrderService);
  private snackbar = inject(SnackbarService);

  user: User | null = null;

  addresses: Address[] = [];
  loadingAddresses = true;

  recentOrders: Order[] = [];
  loadingOrders = true;

  showAddressForm = false;
  editingAddress: Address | null = null;
  addressPendingDelete: Address | null = null;

  ngOnInit() {
    this.user = this.authService.getCurrentUser();
    this.loadAddresses();
    this.loadRecentActivity();
  }

  private loadAddresses() {
    this.loadingAddresses = true;
    this.addressService.getAddresses().subscribe({
      next: addresses => {
        this.addresses = addresses;
        this.loadingAddresses = false;
      },
      error: () => {
        this.loadingAddresses = false;
        this.snackbar.error('Could not load your saved addresses.');
      }
    });
  }

  private loadRecentActivity() {
    this.loadingOrders = true;
    this.orderService.getOrders().subscribe({
      next: orders => {
        this.recentOrders = orders.slice(0, 3);
        this.loadingOrders = false;
      },
      error: () => {
        this.loadingOrders = false;
      }
    });
  }

  openAddAddress() {
    this.editingAddress = null;
    this.showAddressForm = true;
  }

  openEditAddress(address: Address) {
    this.editingAddress = address;
    this.showAddressForm = true;
  }

  closeAddressForm() {
    this.showAddressForm = false;
    this.editingAddress = null;
  }

  saveAddress(address: Address) {

    const request = address.id
      ? this.addressService.updateAddress(address.id, address)
      : this.addressService.addAddress(address);

    request.subscribe({
      next: saved => {

        if (address.id) {
          this.addresses = this.addresses.map(a => a.id === saved.id ? saved : a);
        } else {
          this.addresses = [...this.addresses, saved];
        }

        this.snackbar.success(address.id ? 'Address updated.' : 'Address added.');
        this.closeAddressForm();
      },
      error: () => this.snackbar.error('Could not save this address. Please try again.')
    });
  }

  askDeleteAddress(address: Address) {
    this.addressPendingDelete = address;
  }

  cancelDeleteAddress() {
    this.addressPendingDelete = null;
  }

  confirmDeleteAddress() {

    if (!this.addressPendingDelete) {
      return;
    }

    const id = this.addressPendingDelete.id!;

    this.addressService.deleteAddress(id).subscribe({
      next: () => {
        this.addresses = this.addresses.filter(a => a.id !== id);
        this.snackbar.info('Address removed.');
        this.addressPendingDelete = null;
      },
      error: () => {
        this.snackbar.error('Could not remove this address.');
        this.addressPendingDelete = null;
      }
    });
  }

  statusBadgeClass(status: Order['status']): string {
    switch (status) {
      case 'delivered': return 'bg-green-50 text-green-700';
      case 'shipped': return 'bg-blue-50 text-blue-700';
      case 'processing': return 'bg-amber-50 text-amber-700';
      case 'cancelled': return 'bg-red-50 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  }
}
