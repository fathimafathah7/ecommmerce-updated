import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
    {
        path:'',
        loadComponent:()=>
            import('./features/home/home.component')
        .then(m=>m.HomeComponent)

    },
    {
        path:'products',
        loadComponent:()=>
            import('./features/products/product-list/product-list.component')
        .then(m =>m.ProductListComponent)
    },
    {
        path:'products/:id',
        loadComponent:()=>
            import('./features/products/product-detail/product-detail.component')
        .then(m=> m.ProductDetailComponent)
    },
    {
        path:'cart',
        loadComponent:()=>
            import('./features/cart/cart.component')
        .then(m =>m.CartComponent),
        canActivate:[authGuard]
    },
    {
        path:'wishlist',
        loadComponent:() =>
            import('./features/wishlist/wishlist.component')
        .then(m=> m.WishlistComponent),
        canActivate:[authGuard]
    },
    {
        path: 'checkout',
        loadComponent: () =>
            import('./features/checkout/checkout.component')
        .then(m => m.CheckoutComponent),
        canActivate:[authGuard]
    },
    {
        path: 'profile',
        loadComponent: () =>
            import('./features/profile/profile.component')
        .then(m => m.ProfileComponent),
        canActivate:[authGuard]
    },
    {
        path: 'orders',
        loadComponent: () =>
            import('./features/orders/orders.component')
        .then(m => m.OrdersComponent),
        canActivate:[authGuard]
    },
    {
        path: 'auth',
        loadComponent: () =>
        import('./features/auth/auth.component')
      .then(m => m.AuthComponent)

    },
    {
        path: '**',
        redirectTo: ''
    }
];
