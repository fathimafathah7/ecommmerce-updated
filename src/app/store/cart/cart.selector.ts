import { createFeatureSelector, createSelector } from '@ngrx/store';
import { CartState } from './cart.reducer';

export const selectCartState =
  createFeatureSelector<CartState>('cart');

export const selectCartItems =
  createSelector(
    selectCartState,
    state => state.items
  );

export const selectCartLoaded =
  createSelector(
    selectCartState,
    state => state.loaded
  );

export const selectCartItemCount =
  createSelector(
    selectCartItems,
    items => items.reduce(
      (total, item) => total + item.quantity,
      0
    )
  );

export const selectCartTotal =
  createSelector(
    selectCartItems,
    items => items.reduce(
      (total, item) =>
        total + item.product.price * item.quantity,
      0
    )
  );

export const selectIsInCart = (productId: number | string) =>
  createSelector(
    selectCartItems,
    items => items.some(
      item => String(item.product.id) === String(productId)
    )
  );
