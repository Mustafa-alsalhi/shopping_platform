import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
  { path: 'orders', loadComponent: () => import('./pages/admin-orders/admin-orders.component').then(m => m.AdminOrdersComponent) },
  { path: 'products', loadComponent: () => import('./pages/admin-products/admin-products.component').then(m => m.AdminProductsComponent) },
  { path: 'categories', loadComponent: () => import('./pages/admin-categories/admin-categories.component').then(m => m.AdminCategoriesComponent) },
  { path: 'activities', loadComponent: () => import('./pages/admin-activities/admin-activities.component').then(m => m.AdminActivitiesComponent) },
  { path: 'sellers', loadComponent: () => import('./pages/admin-sellers/admin-sellers.component').then(m => m.AdminSellersComponent) },
  { path: 'drivers', loadComponent: () => import('./pages/admin-drivers/admin-drivers.component').then(m => m.AdminDriversComponent) },
  { path: 'users', loadComponent: () => import('./pages/admin-users/admin-users.component').then(m => m.AdminUsersComponent) },
  { path: 'banners', loadComponent: () => import('./pages/admin-banners/admin-banners.component').then(m => m.AdminBannersComponent) },
  { path: 'offers', loadComponent: () => import('./pages/admin-offers/admin-offers.component').then(m => m.AdminOffersComponent) },
  { path: 'coupons', loadComponent: () => import('./pages/admin-coupons/admin-coupons.component').then(m => m.AdminCouponsComponent) },
  { path: 'payment-methods', loadComponent: () => import('./pages/admin-payment-methods/admin-payment-methods.component').then(m => m.AdminPaymentMethodsComponent) },
  { path: 'payment-requests', loadComponent: () => import('./pages/admin-payment-requests/admin-payment-requests.component').then(m => m.AdminPaymentRequestsComponent) },
  { path: 'shipping-companies', loadComponent: () => import('./pages/admin-shipping-companies/admin-shipping-companies.component').then(m => m.AdminShippingCompaniesComponent) },
  { path: 'taxes', loadComponent: () => import('./pages/admin-taxes/admin-taxes.component').then(m => m.AdminTaxesComponent) },
  { path: 'policies', loadComponent: () => import('./pages/admin-policies/admin-policies.component').then(m => m.AdminPoliciesComponent) },
  { path: 'contact-us', loadComponent: () => import('./pages/admin-contact-us/admin-contact-us.component').then(m => m.AdminContactUsComponent) },
  { path: 'about-us', loadComponent: () => import('./pages/admin-about-us/admin-about-us.component').then(m => m.AdminAboutUsComponent) },
  { path: 'settings', loadComponent: () => import('./pages/admin-settings/admin-settings.component').then(m => m.AdminSettingsComponent) }
];

