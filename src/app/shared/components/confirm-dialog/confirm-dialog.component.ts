import { Component, input, output } from '@angular/core';

/**
 * Small, reusable "are you sure?" popup used anywhere an item can be
 * deleted (cart, wishlist, saved addresses, ...). Purely presentational —
 * the parent owns the open/close state and decides what happens on confirm.
 */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent {

  title = input<string>('Are you sure?');
  message = input<string>('This action cannot be undone.');
  confirmLabel = input<string>('Delete');
  cancelLabel = input<string>('Cancel');

  confirmed = output<void>();
  cancelled = output<void>();

  onConfirm() {
    this.confirmed.emit();
  }

  onCancel() {
    this.cancelled.emit();
  }
}
