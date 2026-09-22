import { createReducer,on } from "@ngrx/store";
import { Product } from "../../core/models/product.model";
import { loadProducts,loadProductsSuccess,loadProductsFailure } from "./product.action";

export interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

export const initialState: ProductState = {
  products: [],
  loading: false,
  error: null
};

export const productReducer = createReducer(
  initialState,

  on(loadProducts, state => ({
    ...state,
    loading: true,
    error: null
  })),

  on(loadProductsSuccess, (state, { products }) => ({
    ...state,
    products,
    loading: false
  })),

  on(loadProductsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);