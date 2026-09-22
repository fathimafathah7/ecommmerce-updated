import { createAction, props } from '@ngrx/store'
import { Product } from '../../core/models/product.model';

export  const  loadProducts=createAction(
    '[products] Load Products'
);
export const loadProductsSuccess=createAction(
    '[products] Load Product Success',
    props<{ products:Product[] }>()
);
export const loadProductsFailure=createAction(
    '[products] Load Products Failed',
    props<{ error:string }>()
);