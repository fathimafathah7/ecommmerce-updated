import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
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
   // --- Profile photo upload ---
  @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;
  uploadingPhoto = false;
 
  private readonly maxPhotoSizeBytes = 2 * 1024 * 1024; 

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
   // --- Profile photo upload ---
 
  /** Clicking the avatar (or its camera badge) opens the hidden file picker. */
  triggerPhotoUpload() {
    this.photoInput?.nativeElement.click();
  }
 
  onPhotoSelected(event: Event) {
 
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
 
    // Reset the input so selecting the same file again still fires a
    // change event next time.
    input.value = '';
 
    if (!file) {
      return;
    }
 
    if (!file.type.startsWith('image/')) {
      this.snackbar.error('Please choose an image file.');
      return;
    }
 
    if (file.size > this.maxPhotoSizeBytes) {
      this.snackbar.error('Image is too large. Please choose one under 2MB.');
      return;
    }
 
    if (!this.user?.id) {
      return;
    }
 
    const reader = new FileReader();
 
    reader.onload = () => {
 
      const dataUrl = reader.result as string;
 
      this.uploadingPhoto = true;
 
      this.authService.updateProfilePhoto(this.user!.id!, dataUrl).subscribe({
        next: updatedUser => {
 
          this.user = updatedUser;
          // Keep localStorage / the app-wide currentUser$ stream in sync
          // so the new photo shows up anywhere else it's used too.
          this.authService.setCurrentUser(updatedUser);
 
          this.uploadingPhoto = false;
          this.snackbar.success('Profile photo updated.');
        },
        error: () => {
          this.uploadingPhoto = false;
          this.snackbar.error('Could not update your profile photo. Please try again.');
        }
      });
    };
 
    reader.onerror = () => {
      this.snackbar.error('Could not read that file. Please try again.');
    };
 
    reader.readAsDataURL(file);
  }
 

  statusBadgeClass(status: Order['status']): string {
    switch (status) {
  case 'delivered': return 'bg-green-100 text-green-700';
  case 'shipped': return 'bg-blue-100 text-blue-700';
  case 'processing': return 'bg-yellow-100 text-yellow-700';
  case 'cancelled': return 'bg-red-100 text-red-700';
  default: return 'bg-gray-100 text-gray-700';
}
  }
}
