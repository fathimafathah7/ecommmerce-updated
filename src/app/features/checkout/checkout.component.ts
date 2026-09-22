import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { forkJoin, of, Observable } from 'rxjs';

import { selectCartItems, selectCartTotal } from '../../store/cart/cart.selector';
import { clearCart } from '../../store/cart/cart.action';
import { CartService } from '../../core/services/cart.service';
import { CartItem } from '../../core/models/cart.model';

import { Address } from '../../core/models/address.model';
import { AddressService } from '../../core/services/address.service';
import { OrderService } from '../../core/services/order.service';
import { AuthService } from '../../core/services/auth.service';
import { SnackbarService } from '../../core/services/snackbar.service';

import { AddressFormComponent } from '../../shared/components/address-form/address-form.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PaymentMethod } from '../../core/models/order.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [
    AsyncPipe,
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    AddressFormComponent,
    ConfirmDialogComponent
  ],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private cartService = inject(CartService);
  private addressService = inject(AddressService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);

  items$ = this.store.select(selectCartItems);
  total$ = this.store.select(selectCartTotal);

  addresses: Address[] = [];
  loadingAddresses = true;

  selectedAddressId: number | string | null = null;

  showAddressForm = false;
  editingAddress: Address | null = null;
  addressPendingDelete: Address | null = null;

  placingOrder = false;

  paymentForm = this.fb.group({
    method: this.fb.control<PaymentMethod>('cod', Validators.required),
    cardNumber: [''],
    cardExpiry: [''],
    cardCvv: [''],
    upiId: ['']
  });

  ngOnInit() {
    this.loadAddresses();
    this.wireConditionalPaymentValidators();
  }

  private loadAddresses() {
    this.loadingAddresses = true;
    this.addressService.getAddresses().subscribe({
      next: addresses => {
        this.addresses = addresses;
        this.loadingAddresses = false;

        const defaultAddress = addresses.find(a => a.isDefault) ?? addresses[0];
        if (defaultAddress) {
          this.selectedAddressId = defaultAddress.id!;
        }
      },
      error: () => {
        this.loadingAddresses = false;
        this.snackbar.error('Could not load your saved addresses.');
      }
    });
  }

  private wireConditionalPaymentValidators() {

    this.paymentForm.controls.method.valueChanges.subscribe(method => {

      const card = this.paymentForm.controls.cardNumber;
      const expiry = this.paymentForm.controls.cardExpiry;
      const cvv = this.paymentForm.controls.cardCvv;
      const upi = this.paymentForm.controls.upiId;

      card.clearValidators();
      expiry.clearValidators();
      cvv.clearValidators();
      upi.clearValidators();

      if (method === 'card') {
        card.setValidators([Validators.required, Validators.pattern(/^\d{16}$/)]);
        expiry.setValidators([Validators.required, Validators.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)]);
        cvv.setValidators([Validators.required, Validators.pattern(/^\d{3}$/)]);
      }

      if (method === 'upi') {
        upi.setValidators([Validators.required, Validators.pattern(/^[\w.\-]{2,}@[a-zA-Z]{2,}$/)]);
      }

      card.updateValueAndValidity();
      expiry.updateValueAndValidity();
      cvv.updateValueAndValidity();
      upi.updateValueAndValidity();

    });
  }

  // --- Address management ---

  openAddAddress() {
    this.editingAddress = null;
    this.showAddressForm = true;
  }

  openEditAddress(address: Address, event: Event) {
    event.stopPropagation();
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
          this.selectedAddressId = saved.id!;
        }

        this.snackbar.success(address.id ? 'Address updated.' : 'Address added.');
        this.closeAddressForm();
      },
      error: () => this.snackbar.error('Could not save this address. Please try again.')
    });
  }

  askDeleteAddress(address: Address, event: Event) {
    event.stopPropagation();
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
        if (this.selectedAddressId === id) {
          this.selectedAddressId = this.addresses[0]?.id ?? null;
        }
        this.snackbar.info('Address removed.');
        this.addressPendingDelete = null;
      },
      error: () => {
        this.snackbar.error('Could not remove this address.');
        this.addressPendingDelete = null;
      }
    });
  }

  selectAddress(id: number | string) {
    this.selectedAddressId = id;
  }

  // --- Order placement ---

  get selectedPaymentMethod(): PaymentMethod {
    return this.paymentForm.controls.method.value as PaymentMethod;
  }

  placeOrder(items: CartItem[], total: number) {

    if (items.length === 0) {
      this.snackbar.warning('Your cart is empty.');
      return;
    }

    if (!this.selectedAddressId) {
      this.snackbar.warning('Please select or add a delivery address.');
      return;
    }

    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.snackbar.warning('Please check your payment details.');
      return;
    }

    const address = this.addresses.find(a => a.id === this.selectedAddressId);

    if (!address) {
      this.snackbar.error('Selected address could not be found. Please pick another.');
      return;
    }

    this.placingOrder = true;

    this.orderService.placeOrder({
      userId: this.authService.getCurrentUserId()!,
      items,
      address,
      paymentMethod: this.selectedPaymentMethod,
      total,
      status: 'placed',
      createdAt: new Date().toISOString()
    }).subscribe({
      next: () => {

        // Clear the persisted cart on the backend, then reset local state.
        const deletions = items.map(item => this.cartService.removeFromCart(item.id!));

        const deletions$: Observable<unknown> = deletions.length
          ? forkJoin(deletions)
          : of(null);

        deletions$.subscribe({
          next: () => {
            this.store.dispatch(clearCart());
            this.placingOrder = false;
            this.snackbar.success('Order placed successfully!');
            this.router.navigate(['/orders']);
          },
          error: () => {
            this.placingOrder = false;
            this.store.dispatch(clearCart());
            this.snackbar.success('Order placed successfully!');
            this.router.navigate(['/orders']);
          }
        });

      },
      error: () => {
        this.placingOrder = false;
        this.snackbar.error('Could not place your order. Please try again.');
      }
    });
  }
}
