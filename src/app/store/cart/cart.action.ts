import { createAction, props } from '@ngrx/store';
import { Product } from '../../core/models/product.model';
import { CartItem } from '../../core/models/cart.model';

// LOAD CART
export const loadCart = createAction(
  '[Cart] Load Cart'
);

export const loadCartSuccess = createAction(
  '[Cart] Load Cart Success',
  props<{ items: CartItem[] }>()
);

// CLEAR (used on logout / after placing an order)
export const clearCart = createAction(
  '[Cart] Clear Cart'
);

// ADD TO CART (goes through the effect: it decides whether to
// create a new cart item or bump the quantity of an existing one)
export const addToCart = createAction(
  '[Cart] Add To Cart',
  props<{ product: Product }>()
);

export const addToCartSuccess = createAction(
  '[Cart] Add To Cart Success',
  props<{ item: CartItem }>()
);

// BUY NOW: same as add to cart, but always navigates to /checkout afterwards
export const buyNow = createAction(
  '[Cart] Buy Now',
  props<{ product: Product }>()
);

// Fired when nothing needs to change in the store but we still need a
// terminal action for an effect stream (e.g. product already at max qty).
export const cartNoop = createAction('[Cart] Noop');

export const removeFromCart = createAction(
  '[Cart] Remove From Cart',
  props<{ item: CartItem }>()
);

export const increaseQuantity = createAction(
  '[Cart] Increase Quantity',
  props<{ item: CartItem }>()
);

export const decreaseQuantity = createAction(
  '[Cart] Decrease Quantity',
  props<{ item: CartItem }>()
);

export const removeFromCartSuccess = createAction(
  '[Cart] Remove From Cart Success',
  props<{ productId: number | string }>()
);

export const updateQuantitySuccess = createAction(
  '[Cart] Update Quantity Success',
  props<{ item: CartItem }>()
);
