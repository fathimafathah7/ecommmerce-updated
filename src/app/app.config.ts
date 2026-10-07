import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';


import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { productReducer } from './store/products/product.reducer';
import { ProductEffects } from './store/products/product.effects';
import { cartReducer } from './store/cart/cart.reducer';
import { CartEffects } from './store/cart/cart.effects';
import { WishlistEffects } from './store/wishlist/wishlist.effects';
import { wishlistReducer } from './store/wishlist/wishlist.reducer';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes,withInMemoryScrolling({scrollPositionRestoration:'top'
  })),
    provideHttpClient(),
    provideAnimations(),
    provideStore({
      products:productReducer,
      cart:cartReducer,
      wishlist:wishlistReducer
    }),
    provideEffects(ProductEffects,CartEffects,WishlistEffects),
    provideCharts(withDefaultRegisterables())
  ]
};
