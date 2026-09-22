import { Component, inject, input } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { switchMap } from 'rxjs';
import { Product } from '../../../core/models/product.model';
import { toggleWishlist } from '../../../store/wishlist/wishlist.action';
import { selectIsInWishlist } from '../../../store/wishlist/wishlist.selector';

/**
 * Heart / wishlist toggle button reused across the product list,
 * product detail, and cart pages so the "filled = in wishlist" behaviour
 * stays perfectly consistent everywhere it appears.
 */
@Component({
  selector: 'app-wishlist-button',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './wishlist-button.component.html',
  styleUrl: './wishlist-button.component.css'
})
export class WishlistButtonComponent {

  product = input.required<Product>();
  /** 'sm' for compact contexts like the cart row, 'md' default for cards/detail */
  size = input<'sm' | 'md'>('md');

  private store = inject(Store);

  private product$ = toObservable(this.product);

  isInWishlist$ = this.product$.pipe(
    switchMap(product => this.store.select(selectIsInWishlist(product.id)))
  );

  toggle(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.store.dispatch(toggleWishlist({ product: this.product() }));
  }
}
