import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { SellerService } from '../../core/services/seller.service';
import { resolveAdminImg } from '../utils/image.utils';

interface SellerNavItem {
  path: string;
  label: string;
  icon: string;
}

interface SellerNavGroup {
  key: string;
  title: string;
  icon: string;
  items: SellerNavItem[];
}

@Component({
  selector: 'app-seller-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex bg-gray-100" dir="rtl">
      <!-- Mobile overlay -->
      @if (mobileOpen()) {
        <div class="fixed inset-0 z-40 bg-black/50 lg:hidden" (click)="mobileOpen.set(false)"></div>
      }

      <!-- Sidebar -->
      <aside
        class="fixed lg:static inset-y-0 right-0 z-50 w-72 bg-slate-900 text-slate-200 flex flex-col shrink-0 shadow-xl transition-transform duration-200 lg:translate-x-0"
        [class.translate-x-full]="!mobileOpen()"
        [class.translate-x-0]="mobileOpen()">
        <div class="p-4 border-b border-slate-800 flex items-center justify-between gap-2">
          <a routerLink="/seller/dashboard" class="flex items-center gap-2.5 min-w-0">
            @if (store()?.logo) {
              <img [src]="img(store().logo)" class="w-9 h-9 rounded-xl object-cover border border-slate-700 shrink-0" />
            } @else {
              <div class="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center font-extrabold shrink-0">🏪</div>
            }
            <div class="min-w-0">
              <p class="text-sm font-extrabold text-amber-400 truncate">{{ store()?.name || store()?.store_name || 'لوحة البائع' }}</p>
              <p class="text-[11px] text-slate-400">{{ store()?.type === 'restaurant' ? 'بوابة المطعم' : 'بوابة المتجر' }}</p>
            </div>
          </a>
          <a routerLink="/" title="العودة للمتجر" class="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition shrink-0">المتجر ↗</a>
        </div>

        <nav class="flex-1 overflow-y-auto p-3 space-y-1.5 text-sm">
          <!-- Direct Dashboard Link -->
          <a
            routerLink="/seller/dashboard"
            routerLinkActive="bg-amber-600 text-white font-bold shadow-md"
            (click)="mobileOpen.set(false)"
            class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition">
            <span>📊</span>
            <span>لوحة التحكم</span>
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
                      [routerLinkActiveOptions]="{ exact: item.path === '/seller/products' }"
                      (click)="mobileOpen.set(false)"
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

        <div class="p-4 border-t border-slate-800 space-y-2">
          <div class="flex items-center justify-between text-xs text-slate-300">
            <span class="truncate font-bold">{{ auth.currentUser()?.name }}</span>
            <span class="badge bg-emerald-900 text-emerald-300 text-[10px]">{{ store()?.status || 'نشط' }}</span>
          </div>
          <button (click)="auth.logout()" class="w-full py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700">
            تسجيل الخروج
          </button>
        </div>
      </aside>

      <!-- Main Area -->
      <div class="flex-1 flex flex-col min-w-0">
        <header class="bg-white shadow-sm px-4 lg:px-6 py-3 flex items-center justify-between gap-3 sticky top-0 z-30">
          <div class="flex items-center gap-3">
            <button (click)="mobileOpen.set(!mobileOpen())" class="lg:hidden p-2 rounded-lg border border-gray-200 text-gray-700">☰</button>
            <h1 class="font-bold text-gray-800 text-sm sm:text-base">بوابة إدارة المتجر والمبيعات</h1>
          </div>
          <div class="flex items-center gap-3">
            <a routerLink="/seller/products/new" class="hidden sm:inline-flex btn btn-primary text-xs py-1.5 px-3">+ منتج جديد</a>
            <div class="relative">
              <button (click)="notifOpen.set(!notifOpen())" class="relative p-2 rounded-lg border border-amber-100 hover:bg-amber-50">
                🔔
                @if (unreadCount() > 0) {
                  <span class="absolute -top-1 -left-1 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{{ unreadCount() }}</span>
                }
              </button>
              @if (notifOpen()) {
                <div class="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-amber-100 p-3 z-50 space-y-2">
                  <div class="flex items-center justify-between border-b pb-2">
                    <span class="font-extrabold text-xs">الإشعارات</span>
                    <button (click)="readAll()" class="text-[11px] text-amber-700 font-bold">تعليم الكل كمقروء</button>
                  </div>
                  <div class="max-h-64 overflow-y-auto space-y-1.5">
                    @for (n of notifications(); track n.id) {
                      <div class="p-2 rounded-lg text-xs" [class]="n.is_read ? 'bg-gray-50 text-gray-600' : 'bg-amber-50 font-bold text-gray-900'">
                        <p>{{ n.title || n.message }}</p>
                        <p class="text-[10px] text-gray-400 mt-0.5">{{ n.created_at | date:'short' }}</p>
                      </div>
                    } @empty {
                      <p class="text-xs text-gray-400 text-center py-4">لا توجد إشعارات.</p>
                    }
                  </div>
                </div>
              }
            </div>
            <span class="text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-semibold">Seller Portal</span>
          </div>
        </header>
        <main class="flex-1 p-4 lg:p-6 overflow-y-auto">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class SellerLayoutComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly seller = inject(SellerService);
  private readonly router = inject(Router);

  readonly store = signal<any>(null);
  readonly notifications = signal<any[]>([]);
  readonly unreadCount = signal(0);
  readonly mobileOpen = signal(false);
  readonly notifOpen = signal(false);
  img = resolveAdminImg;

  readonly openGroups = signal<Record<string, boolean>>({
    catalog: true,
    sales: false,
    marketing: false,
    store: false
  });

  readonly menuGroups: SellerNavGroup[] = [
    {
      key: 'catalog',
      title: 'المنتجات والأقسام',
      icon: '🛍️',
      items: [
        { path: '/seller/products', label: 'المنتجات / الوجبات', icon: '📦' },
        { path: '/seller/products/new', label: 'إضافة منتج جديد', icon: '➕' },
        { path: '/seller/categories', label: 'أقسام المتجر الخاصة', icon: '🗂️' }
      ]
    },
    {
      key: 'sales',
      title: 'المبيعات والمالية',
      icon: '💰',
      items: [
        { path: '/seller/orders', label: 'الطلبات الواردة', icon: '🧾' },
        { path: '/seller/payment-requests', label: 'عمليات الدفع', icon: '💳' },
        { path: '/seller/reports', label: 'التقارير والأرباح', icon: '📈' }
      ]
    },
    {
      key: 'marketing',
      title: 'التسويق والعروض',
      icon: '📣',
      items: [
        { path: '/seller/offers', label: 'العروض والتخفيضات', icon: '🔥' },
        { path: '/seller/coupons', label: 'كوبونات المتجر', icon: '🎟️' }
      ]
    },
    {
      key: 'store',
      title: 'التواصل وإعدادات المتجر',
      icon: '⚙️',
      items: [
        { path: '/seller/chat', label: 'رسائل العملاء', icon: '💬' },
        { path: '/seller/settings', label: 'إعدادات المتجر والموقع', icon: '🛠️' }
      ]
    }
  ];

  ngOnInit(): void {
    this.seller.getSettings().subscribe({ next: (r) => this.store.set(r?.data || r) });
    this.loadNotifs();
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

  isGroupActive(group: SellerNavGroup): boolean {
    const url = this.router.url;
    return group.items.some((item) => url.startsWith(item.path));
  }

  private expandActiveGroup(url: string): void {
    const match = this.menuGroups.find((g) => g.items.some((item) => url.startsWith(item.path)));
    if (match) {
      this.openGroups.update((curr) => ({ ...curr, [match.key]: true }));
    }
  }

  loadNotifs() {
    this.seller.getNotifications().subscribe({
      next: (r) => {
        const list = Array.isArray(r) ? r : r?.data || [];
        this.notifications.set(list);
        this.unreadCount.set(list.filter((x: any) => !x.is_read).length);
      }
    });
  }

  readAll() {
    this.seller.markAllNotificationsRead().subscribe({ next: () => this.loadNotifs() });
  }
}
