import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet ,NavigationEnd,Router} from '@angular/router';
import { Store } from '@ngrx/store';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { AuthService } from './core/services/auth.service';
import { loadCart, clearCart } from './store/cart/cart.action';
import { loadWishlist, clearWishlist } from './store/wishlist/wishlist.action';
import { filter, map, startWith } from 'rxjs';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet,NavbarComponent,AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'ecommerce';

  private store = inject(Store);
  private authService = inject(AuthService);
  private router = inject(Router);

private noChromeRoutes = ['/auth','/admin'];

showChrome$ = this.router.events.pipe(
  filter(event => event instanceof NavigationEnd),
  map(event => !this.noChromeRoutes.some(
    route => (event as NavigationEnd).urlAfterRedirects.startsWith(route)
  )),
  startWith(!this.noChromeRoutes.some(route => this.router.url.startsWith(route)))
);

  ngOnInit() {
    // Keep cart/wishlist state in sync with whoever is currently signed
    // in: load fresh data the moment someone logs in, and wipe the store
    // the moment they log out so the next person never sees stale data.
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.store.dispatch(loadCart());
        this.store.dispatch(loadWishlist());
      } else {
        this.store.dispatch(clearCart());
        this.store.dispatch(clearWishlist());
      }
    });
  }
}
