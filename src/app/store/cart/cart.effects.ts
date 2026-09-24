import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';

import { map, switchMap, tap } from 'rxjs';

import { CartService } from '../../core/services/cart.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { AuthService } from '../../core/services/auth.service';

import {
  loadCart,
  loadCartSuccess,
  addToCart,
  addToCartSuccess,
  buyNow,
  cartNoop,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  updateQuantitySuccess,
  removeFromCartSuccess
} from './cart.action';


@Injectable()
export class CartEffects {

  private actions$ = inject(Actions);
  private cartService = inject(CartService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  private authService = inject(AuthService);

  /**
   * Every cart-mutating action funnels through here. If nobody is signed
   * in, bounce to the auth page with a toast instead of hitting the API
   * (which would otherwise happily create a cart item with userId=null).
   */
  private requireAuth(): boolean {

    if (this.authService.isLoggedIn()) {
      return true;
    }

    this.snackbar.warning('Please sign in to add items to your cart.');
    this.router.navigate(['/auth']);
    return false;
  }


  // LOAD CART
  loadCart$ = createEffect(() =>

    this.actions$.pipe(
      ofType(loadCart),
      switchMap(() =>
        this.cartService.getCart().pipe(
          map(items => loadCartSuccess({ items }))
        )
      )
    )

  );


  // ADD TO CART
  addToCart$ = createEffect(() =>

    this.actions$.pipe(

      ofType(addToCart),

      switchMap(({ product }) => {

        if (!this.requireAuth()) {
          return [cartNoop()];
        }

        return this.cartService.getCart().pipe(

          switchMap(items => {

            const existingItem = items.find(
              item => String(item.product.id) === String(product.id)
            );

            if (existingItem) {

              if (existingItem.quantity >= product.maxQuantity) {
                this.snackbar.warning(
                  `You already have the maximum quantity of "${product.name}" in your cart.`
                );
                return [cartNoop()];
              }

              return this.cartService
                .updateQuantity(existingItem.id!, existingItem.quantity + 1)
                .pipe(
                  tap(() =>
                    this.snackbar.success(`"${product.name}" is already in your cart — quantity updated.`)
                  ),
                  map(updatedItem => addToCartSuccess({ item: updatedItem }))
                );
            }

            return this.cartService
              .addToCart({ product, quantity: 1 })
              .pipe(
                tap(() => this.snackbar.success(`"${product.name}" added to cart.`)),
                map(createdItem => addToCartSuccess({ item: createdItem }))
              );

          })

        );

      })

    )

  );


  // BUY NOW
  buyNow$ = createEffect(() =>

    this.actions$.pipe(

      ofType(buyNow),

      switchMap(({ product }) => {

        if (!this.requireAuth()) {
          return [cartNoop()];
        }

        return this.cartService.getCart().pipe(

          switchMap(items => {

            const existingItem = items.find(
              item => String(item.product.id) === String(product.id)
            );

            if (existingItem) {

              this.snackbar.info(`"${product.name}" is already in your cart.`);

              this.router.navigate(['/checkout']);

              return [cartNoop()];
            }

            return this.cartService
              .addToCart({ product, quantity: 1 })
              .pipe(
                tap(() => {
                  this.snackbar.success(`"${product.name}" added to cart.`);
                  this.router.navigate(['/checkout']);
                }),
                map(createdItem => addToCartSuccess({ item: createdItem }))
              );

          })

        );

      })

    )

  );


  // INCREASE QUANTITY
  increaseQuantity$ = createEffect(() =>

    this.actions$.pipe(

      ofType(increaseQuantity),

      switchMap(({ item }) =>

        this.cartService
          .updateQuantity(item.id!, item.quantity + 1)
          .pipe(
            map(updatedItem => updateQuantitySuccess({ item: updatedItem }))
          )

      )

    )

  );


  // DECREASE QUANTITY
  decreaseQuantity$ = createEffect(() =>

    this.actions$.pipe(

      ofType(decreaseQuantity),

      switchMap(({ item }) => {

        const newQuantity = item.quantity - 1;

        if (newQuantity <= 0) {

          return this.cartService
            .removeFromCart(item.id!)
            .pipe(
              tap(() => this.snackbar.info(`"${item.product.name}" removed from cart.`)),
              map(() => removeFromCartSuccess({ productId: item.product.id }))
            );

        }

        return this.cartService
          .updateQuantity(item.id!, newQuantity)
          .pipe(
            map(updatedItem => updateQuantitySuccess({ item: updatedItem }))
          );

      })

    )

  );


  // REMOVE ITEM
  removeFromCart$ = createEffect(() =>

    this.actions$.pipe(

      ofType(removeFromCart),

      switchMap(({ item }) =>

        this.cartService
          .removeFromCart(item.id!)
          .pipe(
            tap(() => this.snackbar.info(`"${item.product.name}" removed from cart.`)),
            map(() => removeFromCartSuccess({ productId: item.product.id }))
          )

      )

    )

  );

}