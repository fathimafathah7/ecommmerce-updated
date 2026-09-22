import { createReducer, on } from '@ngrx/store';
import { WishlistItem } from '../../core/models/wishlist.model';
import {
  addToWishlistSuccess,
  clearWishlist,
  loadWishlistSuccess,
  removeFromWishlistSuccess
} from './wishlist.action';

export interface WishlistState {
  items: WishlistItem[];
  loaded: boolean;
}


export const initialState: WishlistState = {
  items: [],
  loaded: false
};


export const wishlistReducer = createReducer(

  initialState,

  // LOAD WISHLIST
  on(
    loadWishlistSuccess,
    (state, { items }) => ({
      ...state,
      items,
      loaded: true
    })
  ),

  // RESET (logout)
  on(clearWishlist, () => ({ ...initialState })),

  // ADD TO WISHLIST
  on(
    addToWishlistSuccess,
    (state, { item }) => {

      const alreadyExists = state.items.some(
        existingItem =>
          String(existingItem.product.id) === String(item.product.id)
      );

      if (alreadyExists) {
        return state;
      }

      return {
        ...state,
        items: [...state.items, item]
      };

    }
  ),

  // REMOVE FROM WISHLIST
  on(
    removeFromWishlistSuccess,
    (state, { id }) => ({
      ...state,
      items: state.items.filter(
        item => String(item.id) !== String(id)
      )
    })
  )

);
