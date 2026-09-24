import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';

import { map, switchMap, tap } from 'rxjs';

import { WishlistService } from '../../core/services/wishlist.service';
import { SnackbarService } from '../../core/services/snackbar.service';
import { AuthService } from '../../core/services/auth.service';

import {
  loadWishlist,
  loadWishlistSuccess,
  toggleWishlist,
  addToWishlist,
  addToWishlistSuccess,
  removeFromWishlist,
  removeFromWishlistSuccess,
  wishlistNoop
} from './wishlist.action';


@Injectable()
export class WishlistEffects {

  private actions$ = inject(Actions);
  private wishlistService = inject(WishlistService);
  private snackbar = inject(SnackbarService);
  private router = inject(Router);
  private authService = inject(AuthService);

  /** Same guard pattern as CartEffects.requireAuth(). */
  private requireAuth(): boolean {

    if (this.authService.isLoggedIn()) {
      return true;
    }

    this.snackbar.warning('Please sign in to use your wishlist.');
    this.router.navigate(['/auth']);
    return false;
  }


  // LOAD WISHLIST
  loadWishlist$ = createEffect(() =>

    this.actions$.pipe(

      ofType(loadWishlist),

      switchMap(() =>

        this.wishlistService
          .getWishlist()
          .pipe(
            map(items => loadWishlistSuccess({ items }))
          )

      )

    )

  );


  // TOGGLE WISHLIST
  toggleWishlist$ = createEffect(() =>

    this.actions$.pipe(

      ofType(toggleWishlist),

      switchMap(({ product }) => {

        if (!this.requireAuth()) {
          return [wishlistNoop()];
        }

        return this.wishlistService.getWishlist().pipe(

          switchMap(items => {

            const existingItem = items.find(
              item => String(item.product.id) === String(product.id)
            );

            if (existingItem) {
              return this.wishlistService
                .removeFromWishlist(existingItem.id!)
                .pipe(
                  tap(() => this.snackbar.info(`"${product.name}" removed from wishlist.`)),
                  map(() => removeFromWishlistSuccess({ id: existingItem.id! }))
                );
            }

            return this.wishlistService
              .addToWishlist({ product })
              .pipe(
                tap(() => this.snackbar.success(`"${product.name}" added to wishlist.`)),
                map(createdItem => addToWishlistSuccess({ item: createdItem }))
              );

          })

        );

      })

    )

  );


  // ADD TO WISHLIST (kept for direct/explicit "add" calls)
  addToWishlist$ = createEffect(() =>

    this.actions$.pipe(

      ofType(addToWishlist),

      switchMap(({ product }) => {

        const item = { product };

        return this.wishlistService
          .addToWishlist(item)
          .pipe(
            tap(() => this.snackbar.success(`"${product.name}" added to wishlist.`)),
            map(createdItem => addToWishlistSuccess({ item: createdItem }))
          );

      })

    )

  );


  // REMOVE FROM WISHLIST
  removeFromWishlist$ = createEffect(() =>

    this.actions$.pipe(

      ofType(removeFromWishlist),

      switchMap(({ item }) =>

        this.wishlistService
          .removeFromWishlist(item.id!)
          .pipe(
            tap(() => this.snackbar.info(`"${item.product.name}" removed from wishlist.`)),
            map(() => removeFromWishlistSuccess({ id: item.id! }))
          )

      )

    )

  );

}