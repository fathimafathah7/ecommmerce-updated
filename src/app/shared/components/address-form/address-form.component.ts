import { Component, OnInit, inject, input, output } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Address } from '../../../core/models/address.model';

/**
 * Add / edit form for a saved address. Used both on the Checkout page
 * (choose or manage delivery address) and the Profile page (manage
 * saved addresses), so validation only lives in one place.
 */
@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './address-form.component.html',
  styleUrl: './address-form.component.css'
})
export class AddressFormComponent implements OnInit {

  /** Pass an existing address to edit it; omit to create a new one. */
  editingAddress = input<Address | null>(null);

  saved = output<Address>();
  cancelled = output<void>();

  private fb = inject(FormBuilder);

  form = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    line1: ['', [Validators.required, Validators.minLength(5)]],
    line2: [''],
    city: ['', [Validators.required]],
    state: ['', [Validators.required]],
    pincode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    isDefault: [false]
  });

  ngOnInit() {
    const existing = this.editingAddress();

    if (existing) {
      this.form.patchValue(existing);
    }
  }

  get isEditMode(): boolean {
    return !!this.editingAddress();
  }

  submit() {

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const existing = this.editingAddress();

    const address: Address = {
      ...(existing ?? {}),
      fullName: value.fullName!,
      phone: value.phone!,
      line1: value.line1!,
      line2: value.line2 ?? '',
      city: value.city!,
      state: value.state!,
      pincode: value.pincode!,
      isDefault: value.isDefault ?? false,
      userId: existing?.userId ?? ''
    };

    this.saved.emit(address);
  }

  cancel() {
    this.cancelled.emit();
  }
}
