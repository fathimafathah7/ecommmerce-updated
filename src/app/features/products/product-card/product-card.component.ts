import {
  Component,
  inject,
  input,
  output
} from '@angular/core';

import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import { addToCart, buyNow } from '../../../store/cart/cart.action';
import { WishlistButtonComponent } from '../../../shared/components/wishlist-button/wishlist-button.component';

import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, WishlistButtonComponent],
  templateUrl: './product-card.component.html',
  styleUrl: './product-card.component.css'
})
export class ProductCardComponent {

  product = input.required<Product>();

  viewDetails = output<number | string>();

  private store = inject(Store);

  addToCart(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    this.store.dispatch(
      addToCart({ product: this.product() })
    );
  }

  buyNow(event: Event) {
    event.preventDefault();
    event.stopPropagation();

    this.store.dispatch(
      buyNow({ product: this.product() })
    );
  }
}
