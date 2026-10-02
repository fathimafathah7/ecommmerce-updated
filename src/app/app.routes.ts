import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard'; 

import { AdminDashboardComponent } from './features/admin/admin-dashboard/admin-dashboard.component';
import { AdminProductsComponent } from './features/admin/admin-products/admin-products.component';
import { AdminOrdersComponent } from './features/admin/admin-orders/admin-orders.component';
import { AdminUsersComponent } from './features/admin/admin-users/admin-users.component';
import { adminGuard } from './core/guards/admin.guard';
import { guestGuard } from './core/guards/guest.guard';
import { noAdminGuard } from './core/guards/no-admin.guard';

export const routes: Routes = [
    {
        path:'',
        loadComponent:()=>
            import('./features/home/home.component')
        .then(m=>m.HomeComponent),
        canActivate:[noAdminGuard]

    },
    {
        path:'products',
        loadComponent:()=>
            import('./features/products/product-list/product-list.component')
        .then(m =>m.ProductListComponent),
        canActivate:[noAdminGuard]
    },
    {
        path:'products/:id',
        loadComponent:()=>
            import('./features/products/product-detail/product-detail.component')
        .then(m=> m.ProductDetailComponent),
        canActivate:[noAdminGuard]
    },
    {
        path:'cart',
        loadComponent:()=>
            import('./features/cart/cart.component')
        .then(m =>m.CartComponent),
        canActivate:[authGuard,noAdminGuard]
    },
    {
        path:'wishlist',
        loadComponent:() =>
            import('./features/wishlist/wishlist.component')
        .then(m=> m.WishlistComponent),
        canActivate:[authGuard,noAdminGuard

        ]
    },
    {
        path: 'checkout',
        loadComponent: () =>
            import('./features/checkout/checkout.component')
        .then(m => m.CheckoutComponent),
        canActivate:[authGuard,noAdminGuard]
    },
    {
        path: 'profile',
        loadComponent: () =>
            import('./features/profile/profile.component')
        .then(m => m.ProfileComponent),
        canActivate:[authGuard,noAdminGuard]
    },
    {
        path: 'orders',
        loadComponent: () =>
            import('./features/orders/orders.component')
        .then(m => m.OrdersComponent),
        canActivate:[authGuard,noAdminGuard]
    },
    {
        path: 'auth',
        canActivate:[guestGuard,noAdminGuard],
        loadComponent: () =>
        import('./features/auth/auth.component')
      .then(m => m.AuthComponent)

    },
    {
        path: 'admin',
        canActivate:[adminGuard],
        loadComponent:()=>
            import('./features/admin/admin-layout/admin-layout.component')
        .then(m=>m.AdminLayoutComponent),
        children:[
            {
                path:'',
                redirectTo:'dashboard',
                pathMatch:'full'
            },
            {
                path:'dashboard',
                component:AdminDashboardComponent
            },
            {
                path:'products',
                component:AdminProductsComponent
            },
            {
                path:'orders',
                component:AdminOrdersComponent
            },
            {
                path:'users',
                component:AdminUsersComponent
            }
        ]
    },
    {
        path: '**',
        redirectTo: ''
    }
];
