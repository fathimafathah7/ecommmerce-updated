import { createReducer, on } from '@ngrx/store';

import {
  decreaseQuantity,
  increaseQuantity,
  removeFromCart,
  loadCartSuccess,
  clearCart,
  addToCartSuccess,
  updateQuantitySuccess,
  removeFromCartSuccess
} from './cart.action';

import { CartItem } from '../../core/models/cart.model';


export interface CartState {
  items: CartItem[];
  loaded: boolean;
}


export const initialState: CartState = {
  items: [],
  loaded: false
};


export const cartReducer = createReducer(

  initialState,

  // LOAD CART
  on(loadCartSuccess, (state, { items }) => ({
    ...state,
    items,
    loaded: true
  })),

  // RESET (logout / order placed)
  on(clearCart, () => ({ ...initialState })),

  // ADD TO CART — server is the source of truth; the effect resolves
  // whether this was a fresh insert or a quantity bump and always hands
  // back the up-to-date item (with its real backend id).
  on(addToCartSuccess, (state, { item }) => {

    const existingIndex = state.items.findIndex(
      existing => String(existing.product.id) === String(item.product.id)
    );

    if (existingIndex === -1) {
      return {
        ...state,
        items: [...state.items, item]
      };
    }

    return {
      ...state,
      items: state.items.map((existing, index) =>
        index === existingIndex ? item : existing
      )
    };
  }),

  // UPDATE QUANTITY AFTER API SUCCESS
  on(
    updateQuantitySuccess,
    (state, { item }) => ({

      ...state,

      items: state.items.map(existingItem =>
        String(existingItem.product.id) === String(item.product.id)
          ? item
          : existingItem
      )

    })
  ),

  // REMOVE AFTER API SUCCESS
  on(
    removeFromCartSuccess,
    (state, { productId }) => ({

      ...state,

      items: state.items.filter(
        item =>
          String(item.product.id) !== String(productId)
      )

    })
  )

);
