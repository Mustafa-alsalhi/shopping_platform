import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';

export const STOREFRONT_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'products', loadComponent: () => import('./pages/products/products.component').then(m => m.ProductsComponent) },
  { path: 'products/:id', loadComponent: () => import('./pages/product-detail/product-detail.component').then(m => m.ProductDetailComponent) },
  { path: 'categories', loadComponent: () => import('./pages/categories/categories.component').then(m => m.CategoriesComponent) },
  { path: 'coupons', loadComponent: () => import('./pages/coupons/coupons.component').then(m => m.CouponsComponent) },
  { path: 'offers', loadComponent: () => import('./pages/offers/offers.component').then(m => m.OffersComponent) },
  { path: 'seller/:id', loadComponent: () => import('./pages/seller-detail/seller-detail.component').then(m => m.SellerDetailComponent) },
  { path: 'sellers', loadComponent: () => import('./pages/sellers/sellers.component').then(m => m.SellersComponent) },
  { path: 'restaurant/:id', loadComponent: () => import('./pages/seller-detail/seller-detail.component').then(m => m.SellerDetailComponent) },
  { path: 'place/:id', loadComponent: () => import('./pages/seller-detail/seller-detail.component').then(m => m.SellerDetailComponent) },
  { path: 'restaurants', redirectTo: () => inject(Router).parseUrl('/?tab=restaurants') },
  { path: 'contact-us', loadComponent: () => import('./pages/contact-us-page/contact-us-page.component').then(m => m.ContactUsPageComponent) },
  { path: 'about-us', loadComponent: () => import('./pages/about-us-page/about-us-page.component').then(m => m.AboutUsPageComponent) },
  { path: 'policy/:type', loadComponent: () => import('./pages/policy-page/policy-page.component').then(m => m.PolicyPageComponent) }
];

