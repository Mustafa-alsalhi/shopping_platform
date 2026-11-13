import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const CUSTOMER_ROUTES: Routes = [
  { path: 'cart', loadComponent: () => import('./pages/cart-page/cart-page.component').then(m => m.CartPageComponent), canActivate: [authGuard] },
  { path: 'checkout', loadComponent: () => import('./pages/checkout/checkout.component').then(m => m.CheckoutComponent), canActivate: [authGuard] },
  { path: 'orders', loadComponent: () => import('./pages/orders/orders.component').then(m => m.OrdersComponent), canActivate: [authGuard] },
  { path: 'orders/:id/track', loadComponent: () => import('./pages/order-tracking/order-tracking.component').then(m => m.OrderTrackingComponent), canActivate: [authGuard] },
  { path: 'wishlist', loadComponent: () => import('./pages/wishlist/wishlist.component').then(m => m.WishlistComponent), canActivate: [authGuard] },
  { path: 'offers/:id', loadComponent: () => import('./pages/offer-details/offer-details.component').then(m => m.OfferDetailsComponent) },
  { path: 'shipping-info', loadComponent: () => import('./pages/shipping-info/shipping-info.component').then(m => m.ShippingInfoComponent) },
  { path: 'account', loadComponent: () => import('./pages/account/account.component').then(m => m.AccountComponent), canActivate: [authGuard] },
  { path: 'chat/:sellerId', loadComponent: () => import('./pages/customer-chat/customer-chat.component').then(m => m.CustomerChatComponent), canActivate: [authGuard] }
];

