import { Routes } from '@angular/router';
import { roleGuard } from './core/guards/auth.guard';
import { CustomerLayoutComponent } from './shared/layouts/customer-layout.component';
import { AdminLayoutComponent } from './shared/layouts/admin-layout.component';
import { SellerLayoutComponent } from './shared/layouts/seller-layout.component';
import { DriverLayoutComponent } from './shared/layouts/driver-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: CustomerLayoutComponent,
    children: [
      { path: '', loadChildren: () => import('./features/storefront/storefront.routes').then(m => m.STOREFRONT_ROUTES) },
      { path: '', loadChildren: () => import('./features/customer/customer.routes').then(m => m.CUSTOMER_ROUTES) },
      { path: '', loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES) }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [roleGuard(['admin'])],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'seller',
    component: SellerLayoutComponent,
    canActivate: [roleGuard(['seller'])],
    loadChildren: () => import('./features/seller/seller.routes').then(m => m.SELLER_ROUTES)
  },
  {
    path: 'driver',
    component: DriverLayoutComponent,
    canActivate: [roleGuard(['driver'])],
    loadChildren: () => import('./features/driver/driver.routes').then(m => m.DRIVER_ROUTES)
  },
  {
    path: '**',
    loadComponent: () => import('./features/customer/pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
