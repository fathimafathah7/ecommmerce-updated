import { Injectable,inject } from "@angular/core";
import { loadProducts,loadProductsFailure,loadProductsSuccess } from "./product.action";
import { createEffect,Actions,ofType } from '@ngrx/effects'
import { ProductService } from "../../core/services/product.service";
import { switchMap,map,of,catchError } from "rxjs";


@Injectable()
export class ProductEffects {

  private actions$ = inject(Actions);
  private productService = inject(ProductService);

  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadProducts),
      switchMap(() =>
        this.productService.getProducts().pipe(
          map(products => loadProductsSuccess({ products })),
          catchError(() =>
            of(loadProductsFailure({ error: 'Failed to load products' }))
          )
        )
      )
    )
  );
}