import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProductState } from './product.reducer';

export const selectProductState =
  createFeatureSelector<ProductState>('products');

export const selectProducts = createSelector(
  selectProductState,
  state => state.products
);

export const selectLoading = createSelector(
  selectProductState,
  state => state.loading
);

export const selectError = createSelector(
  selectProductState,
  state => state.error
);
