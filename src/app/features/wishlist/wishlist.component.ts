import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectWishlistCount, selectWishlistItems } from '../../store/wishlist/wishlist.selector';
import { loadWishlist, removeFromWishlist } from '../../store/wishlist/wishlist.action';
import { addToCart } from '../../store/cart/cart.action';
import { WishlistItem } from '../../core/models/wishlist.model';
import { AsyncPipe, CurrencyPipe } from '@angular/common';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [AsyncPipe, CurrencyPipe, RouterLink, ConfirmDialogComponent],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent implements OnInit {

  private store = inject(Store);
  private router = inject(Router);


  items$ =
    this.store.select(selectWishlistItems);


  count$ =
    this.store.select(selectWishlistCount);

  itemPendingDelete: WishlistItem | null = null;


  ngOnInit() {

    this.store.dispatch(
      loadWishlist()
    );

  }


  addToCart(item: WishlistItem) {
    this.store.dispatch(
      addToCart({ product: item.product })
    );
  }

  askRemove(item: WishlistItem) {
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
      removeFromWishlist({
        item: this.itemPendingDelete
      })
    );

    this.itemPendingDelete = null;

  }

  viewProduct(id: number | string) {
    this.router.navigate(['/products', id]);
  }

}
