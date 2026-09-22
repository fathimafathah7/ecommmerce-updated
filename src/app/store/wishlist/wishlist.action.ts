import { createAction, props } from '@ngrx/store';

import { Product } from '../../core/models/product.model';
import { WishlistItem } from '../../core/models/wishlist.model';


// LOAD WISHLIST
export const loadWishlist = createAction(
  '[Wishlist] Load Wishlist'
);

export const loadWishlistSuccess = createAction(
  '[Wishlist] Load Wishlist Success',
  props<{ items: WishlistItem[] }>()
);

// RESET (logout)
export const clearWishlist = createAction(
  '[Wishlist] Clear Wishlist'
);

// TOGGLE — a single entry point used by the UI (product list, product
// detail, cart). The effect figures out whether to add or remove.
export const toggleWishlist = createAction(
  '[Wishlist] Toggle Wishlist',
  props<{ product: Product }>()
);

// ADD TO WISHLIST
export const addToWishlist = createAction(
  '[Wishlist] Add To Wishlist',
  props<{ product: Product }>()
);

// REMOVE FROM WISHLIST
export const removeFromWishlist = createAction(
  '[Wishlist] Remove From Wishlist',
  props<{ item: WishlistItem }>()
);

// ADD SUCCESS
export const addToWishlistSuccess = createAction(
  '[Wishlist] Add To Wishlist Success',
  props<{ item: WishlistItem }>()
);

// REMOVE SUCCESS
export const removeFromWishlistSuccess = createAction(
  '[Wishlist] Remove From Wishlist Success',
  props<{ id: number | string }>()
);
