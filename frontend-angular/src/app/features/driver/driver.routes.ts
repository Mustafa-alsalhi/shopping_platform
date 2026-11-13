import { Routes } from '@angular/router';

export const DRIVER_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./pages/driver-dashboard/driver-dashboard.component').then(m => m.DriverDashboardComponent) },
  { path: 'orders', loadComponent: () => import('./pages/driver-orders/driver-orders.component').then(m => m.DriverOrdersComponent) },
  { path: 'orders/:id', loadComponent: () => import('./pages/driver-order-details/driver-order-details.component').then(m => m.DriverOrderDetailsComponent) },
  { path: 'settings', loadComponent: () => import('./pages/driver-settings/driver-settings.component').then(m => m.DriverSettingsComponent) }
];

