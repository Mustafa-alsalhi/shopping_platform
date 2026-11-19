import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

interface AdminNavItem {
  path: string;
  label: string;
  icon: string;
}

interface AdminNavGroup {
  key: string;
  title: string;
  icon: string;
  items: AdminNavItem[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex bg-gray-100" dir="rtl">
      <!-- Sidebar -->
      <aside class="w-72 bg-slate-900 text-slate-200 flex flex-col shrink-0 shadow-xl">
        <div class="p-4 border-b border-slate-800 flex items-center justify-between">
          <a routerLink="/admin/dashboard" class="text-lg font-extrabold text-amber-400">لوحة تحكم الإدارة</a>
          <a routerLink="/" class="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition">المتجر ↗</a>
        </div>

        <nav class="flex-1 overflow-y-auto p-3 space-y-1.5 text-sm">
          <!-- Direct Dashboard Link -->
          <a
            routerLink="/admin/dashboard"
            routerLinkActive="bg-amber-600 text-white font-bold shadow-md"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition">
            <span>📊</span>
            <span>لوحة الإحصائيات</span>
          </a>

          <!-- Grouped Accordion Sections -->
          @for (group of menuGroups; track group.key) {
            <div class="pt-1">
              <button
                type="button"
                (click)="toggleGroup(group.key)"
                class="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition text-right font-bold hover:bg-slate-800/80"
                [class.bg-slate-800]="isGroupActive(group) || isGroupOpen(group.key)"
                [class.text-amber-400]="isGroupActive(group)"
                [class.text-slate-300]="!isGroupActive(group)">
                <span class="flex items-center gap-2.5">
                  <span>{{ group.icon }}</span>
                  <span>{{ group.title }}</span>
                </span>
                <svg
                  class="w-4 h-4 transition-transform duration-200 shrink-0"
                  [class.rotate-180]="isGroupOpen(group.key)"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2.2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              @if (isGroupOpen(group.key)) {
                <div class="mt-1 mr-3 pr-2.5 border-r-2 border-slate-700/80 space-y-1">
                  @for (item of group.items; track item.path) {
                    <a
                      [routerLink]="item.path"
                      routerLinkActive="bg-amber-600 text-white font-bold shadow-sm"
                      class="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition">
                      <span>{{ item.icon }}</span>
                      <span>{{ item.label }}</span>
                    </a>
                  }
                </div>
              }
            </div>
          }
        </nav>

        <div class="p-4 border-t border-slate-800">
          <div class="text-xs text-slate-400 mb-2">{{ auth.currentUser()?.name }}</div>
          <button (click)="auth.logout()" class="w-full py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition">
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
export class AdminLayoutComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly openGroups = signal<Record<string, boolean>>({
    catalog: true,
    sales: false,
    accounts: false,
    finance: false,
    marketing: false,
    cms: false
  });

  readonly menuGroups: AdminNavGroup[] = [
    {
      key: 'catalog',
      title: 'الكتالوج والأنشطة',
      icon: '🗂️',
      items: [
        { path: '/admin/products', label: 'المنتجات', icon: '🛍️' },
        { path: '/admin/categories', label: 'الأقسام والتصنيفات', icon: '🏷️' },
        { path: '/admin/activities', label: 'الأنشطة الديناميكية', icon: '🏪' }
      ]
    },
    {
      key: 'sales',
      title: 'الطلبات واللوجستيات',
      icon: '📦',
      items: [
        { path: '/admin/orders', label: 'إدارة الطلبات والتوصيل', icon: '🧾' },
        { path: '/admin/shipping-companies', label: 'شركات الشحن', icon: '🚚' }
      ]
    },
    {
      key: 'accounts',
      title: 'المستخدمين والشركاء',
      icon: '👥',
      items: [
        { path: '/admin/sellers', label: 'البائعين والمطاعم', icon: '🤝' },
        { path: '/admin/drivers', label: 'مندوبي التوصيل', icon: '🛵' },
        { path: '/admin/users', label: 'المستخدمين', icon: '👤' }
      ]
    },
    {
      key: 'finance',
      title: 'المالية والمحاسبة',
      icon: '💰',
      items: [
        { path: '/admin/payment-methods', label: 'طرق الدفع', icon: '💳' },
        { path: '/admin/payment-requests', label: 'طلبات تأكيد الدفع', icon: '🧾' },
        { path: '/admin/taxes', label: 'الضرائب', icon: '📑' }
      ]
    },
    {
      key: 'marketing',
      title: 'التسويق والعروض',
      icon: '📣',
      items: [
        { path: '/admin/banners', label: 'البنرات الإعلانية', icon: '🖼️' },
        { path: '/admin/offers', label: 'العروض الترويجية', icon: '🔥' },
        { path: '/admin/coupons', label: 'كوبونات الخصم', icon: '🎟️' }
      ]
    },
    {
      key: 'cms',
      title: 'المحتوى وإعدادات النظام',
      icon: '⚙️',
      items: [
        { path: '/admin/policies', label: 'السياسات والشروط', icon: '⚖️' },
        { path: '/admin/contact-us', label: 'رسائل تواصل معنا', icon: '✉️' },
        { path: '/admin/about-us', label: 'صفحة من نحن', icon: 'ℹ️' },
        { path: '/admin/settings', label: 'الإعدادات والنسخ الاحتياطي', icon: '🛠️' }
      ]
    }
  ];

  ngOnInit(): void {
    this.expandActiveGroup(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.expandActiveGroup(e.urlAfterRedirects));
  }

  toggleGroup(key: string): void {
    this.openGroups.update((curr) => ({ ...curr, [key]: !curr[key] }));
  }

  isGroupOpen(key: string): boolean {
    return !!this.openGroups()[key];
  }

  isGroupActive(group: AdminNavGroup): boolean {
    const url = this.router.url;
    return group.items.some((item) => url.startsWith(item.path));
  }

  private expandActiveGroup(url: string): void {
    const match = this.menuGroups.find((g) => g.items.some((item) => url.startsWith(item.path)));
    if (match) {
      this.openGroups.update((curr) => ({ ...curr, [match.key]: true }));
    }
  }
}

