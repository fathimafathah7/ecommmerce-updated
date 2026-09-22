import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';

import { WishlistState } from './wishlist.reducer';


// WISHLIST STATE
export const selectWishlistState =
  createFeatureSelector<WishlistState>('wishlist');


// WISHLIST ITEMS
export const selectWishlistItems =
  createSelector(
    selectWishlistState,
    state => state.items
  );


// WISHLIST COUNT
export const selectWishlistCount =
  createSelector(
    selectWishlistItems,
    items => items.length
  );

export const selectIsInWishlist = (productId: number | string) =>
  createSelector(
    selectWishlistItems,
    items =>
      items.some(
        item => String(item.product.id) === String(productId)
      )
  );

export const selectWishlistItem = (productId: number | string) =>
  createSelector(
    selectWishlistItems,
    items =>
      items.find(
        item => String(item.product.id) === String(productId)
      )
  );

export const selectWishlistLoaded =
  createSelector(
    selectWishlistState,
    state => state.loaded
  );
