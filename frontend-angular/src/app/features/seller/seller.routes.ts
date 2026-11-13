import { Routes } from '@angular/router';

export const SELLER_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./pages/seller-dashboard/seller-dashboard.component').then(m => m.SellerDashboardComponent) },
  { path: 'products', loadComponent: () => import('./pages/seller-products/seller-products.component').then(m => m.SellerProductsComponent) },
  { path: 'products/new', loadComponent: () => import('./pages/seller-product-form/seller-product-form.component').then(m => m.SellerProductFormComponent) },
  { path: 'products/:id/edit', loadComponent: () => import('./pages/seller-product-form/seller-product-form.component').then(m => m.SellerProductFormComponent) },
  { path: 'orders', loadComponent: () => import('./pages/seller-orders/seller-orders.component').then(m => m.SellerOrdersComponent) },
  { path: 'payment-requests', loadComponent: () => import('./pages/seller-payment-requests/seller-payment-requests.component').then(m => m.SellerPaymentRequestsComponent) },
  { path: 'categories', loadComponent: () => import('./pages/seller-categories-page/seller-categories-page.component').then(m => m.SellerCategoriesPageComponent) },
  { path: 'settings', loadComponent: () => import('./pages/seller-settings/seller-settings.component').then(m => m.SellerSettingsComponent) },
  { path: 'chat', loadComponent: () => import('./pages/seller-chat/seller-chat.component').then(m => m.SellerChatComponent) },
  { path: 'reports', loadComponent: () => import('./pages/seller-reports/seller-reports.component').then(m => m.SellerReportsComponent) },
  { path: 'offers', loadComponent: () => import('./pages/seller-offers/seller-offers.component').then(m => m.SellerOffersComponent) },
  { path: 'coupons', loadComponent: () => import('./pages/seller-coupons/seller-coupons.component').then(m => m.SellerCouponsComponent) }
];

