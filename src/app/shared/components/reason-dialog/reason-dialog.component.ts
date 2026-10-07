import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

/**
 * Popup that asks the customer to pick a reason (used for cancel / return).
 * An "Other" choice lets them type their own.
 */
@Component({
  selector: 'app-reason-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './reason-dialog.component.html',
  styleUrl: './reason-dialog.component.css'
})
export class ReasonDialogComponent {

  title = input<string>('Select a reason');
  message = input<string>('');
  reasons = input<string[]>([]);
  confirmLabel = input<string>('Confirm');
  cancelLabel = input<string>('Go back');

  confirmed = output<string>();
  cancelled = output<void>();

  readonly otherLabel = 'Other';

  selected = '';
  otherText = '';

  get finalReason(): string {
    return this.selected === this.otherLabel
      ? this.otherText.trim()
      : this.selected;
  }

  get canConfirm(): boolean {
    return this.selected !== '' && this.finalReason.length >= 3;
  }

  confirm() {
    if (!this.canConfirm) {
      return;
    }
    this.confirmed.emit(this.finalReason);
  }

  cancel() {
    this.cancelled.emit();
  }
}