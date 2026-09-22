import {
  Component,
  inject,
  OnInit
} from '@angular/core';

import {
  AsyncPipe,
  CurrencyPipe
} from '@angular/common';

import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { CartItem } from '../../core/models/cart.model';
import { loadCart, increaseQuantity, decreaseQuantity, removeFromCart } from '../../store/cart/cart.action';
import { selectCartItems, selectCartItemCount, selectCartTotal } from '../../store/cart/cart.selector';
import { WishlistButtonComponent } from '../../shared/components/wishlist-button/wishlist-button.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { SnackbarService } from '../../core/services/snackbar.service';


@Component({
  selector: 'app-cart',

  standalone: true,

  imports: [
    AsyncPipe,
    CurrencyPipe,
    RouterLink,
    WishlistButtonComponent,
    ConfirmDialogComponent
  ],

  templateUrl: './cart.component.html',

  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {

  private store = inject(Store);
  private router = inject(Router);
  private snackbar = inject(SnackbarService);


  items$ =
    this.store.select(selectCartItems);


  itemCount$ =
    this.store.select(selectCartItemCount);


  total$ =
    this.store.select(selectCartTotal);

  itemPendingDelete: CartItem | null = null;


  ngOnInit() {

    this.store.dispatch(
      loadCart()
    );

  }



  increase(item: CartItem) {

    if (
      item.quantity <
      item.product.maxQuantity
    ) {

      this.store.dispatch(
        increaseQuantity({ item })
      );

    } else {

      this.snackbar.warning(
        `You already have the maximum quantity of "${item.product.name}" in your cart.`
      );

    }

  }


  decrease(item: CartItem) {

    this.store.dispatch(
      decreaseQuantity({
        item
      })
    );

  }


  askRemove(item: CartItem) {
    this.itemPendingDelete = item;
  }

  cancelRemove() {
    this.itemPendingDelete = null;
  }

  confirmRemove() {

    if (!this.itemPendingDelete) {
      return;
    }

    this.store.dispatch(
      removeFromCart({
        item: this.itemPendingDelete
      })
    );

    this.itemPendingDelete = null;

  }

  goToCheckout(itemCount: number) {

    if (itemCount === 0) {
      this.snackbar.warning('Your cart is empty.');
      return;
    }

    this.router.navigate(['/checkout']);
  }

}
