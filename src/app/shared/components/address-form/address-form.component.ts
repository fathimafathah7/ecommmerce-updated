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
  editingAddress = input<Address | null>(null);

  saved = output<Address>();
  cancelled = output<void>();
  addresspattern=/^[A-Za-z][A-Za-z0-9\s]+$/
  private fb = inject(FormBuilder);
  namepattern=/^[A-Za-z\s]+$/

  readonly addressTypes = [
    { value: 'home', label: 'Home', icon: '🏠' },
    { value: 'work', label: 'Work', icon: '🏢' }
  ];

  form = this.fb.group({
    type: ['home'],
    fullName: ['', [Validators.required, Validators.minLength(3),Validators.pattern(this.namepattern)]],
    phone: ['', [Validators.required, Validators.pattern(/^[6-9]\d{9}$/)]],
    line1: ['', [Validators.required, Validators.minLength(5),Validators.pattern(this.addresspattern)]],
    line2: ['',[Validators.pattern(this.addresspattern)]],
    city: ['', [Validators.required,Validators.pattern(this.namepattern)]],
    state: ['', [Validators.required,Validators.pattern(this.namepattern)]],
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
      type: value.type === 'work' ? 'work' : 'home',
      isDefault: value.isDefault ?? false,
      userId: existing?.userId ?? ''
    };

    this.saved.emit(address);
  }

  cancel() {
    this.cancelled.emit();
  }
}