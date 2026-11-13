import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex bg-gray-100">
      <!-- Sidebar -->
      <aside class="w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0">
        <div class="p-4 border-b border-slate-800 flex items-center justify-between">
          <a routerLink="/admin/dashboard" class="text-lg font-extrabold text-amber-400">لوحة تحكم الإدارة</a>
          <a routerLink="/" class="text-xs text-slate-400 hover:text-white">المتجر ↗</a>
        </div>

        <nav class="flex-1 overflow-y-auto p-3 space-y-1 text-sm">
          @for (item of menuItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-amber-600 text-white font-bold"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition">
              <span>{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="p-4 border-t border-slate-800">
          <div class="text-xs text-slate-400 mb-2">{{ auth.currentUser()?.name }}</div>
          <button (click)="auth.logout()" class="w-full py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700">
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <!-- Main Area -->
      <div class="flex-1 flex flex-col min-w-0">
        <header class="bg-white shadow-sm px-6 py-3 flex items-center justify-between">
          <h1 class="font-bold text-gray-800">نظام إدارة المتجر متعدد البائعين والأنشطة</h1>
          <span class="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-semibold">Admin Portal</span>
        </header>
        <main class="flex-1 p-6 overflow-y-auto">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class AdminLayoutComponent {
  readonly auth = inject(AuthService);

  readonly menuItems = [
    { path: '/admin/dashboard', label: 'لوحة الإحصائيات', icon: '📊' },
    { path: '/admin/orders', label: 'إدارة الطلبات والتوصيل', icon: '📦' },
    { path: '/admin/products', label: 'المنتجات', icon: '🛍️' },
    { path: '/admin/categories', label: 'الأقسام والتصنيفات', icon: '🗂️' },
    { path: '/admin/activities', label: 'الأنشطة الديناميكية', icon: '🏪' },
    { path: '/admin/sellers', label: 'البائعين والمطاعم', icon: '🤝' },
    { path: '/admin/drivers', label: 'مندوبي التوصيل', icon: '🛵' },
    { path: '/admin/users', label: 'المستخدمين', icon: '👥' },
    { path: '/admin/banners', label: 'البنرات الإعلانية', icon: '🖼️' },
    { path: '/admin/offers', label: 'العروض الترويجية', icon: '🔥' },
    { path: '/admin/coupons', label: 'كوبونات الخصم', icon: '🎟️' },
    { path: '/admin/payment-methods', label: 'طرق الدفع', icon: '💳' },
    { path: '/admin/payment-requests', label: 'طلبات تأكيد الدفع', icon: '🧾' },
    { path: '/admin/shipping-companies', label: 'شركات الشحن', icon: '🚚' },
    { path: '/admin/taxes', label: 'الضرائب', icon: '📑' },
    { path: '/admin/policies', label: 'السياسات والشروط', icon: '⚖️' },
    { path: '/admin/contact-us', label: 'رسائل تواصل معنا', icon: '✉️' },
    { path: '/admin/about-us', label: 'صفحة من نحن', icon: 'ℹ️' },
    { path: '/admin/settings', label: 'الإعدادات والنسخ الاحتياطي', icon: '⚙️' }
  ];
}

