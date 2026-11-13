import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { StorefrontService } from '../../core/services/storefront.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  template: `
    <div class="min-h-screen flex flex-col bg-gradient-to-br from-amber-50 to-orange-50">
      <!-- Top Promo / Welcome Bar -->
      <div class="bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 text-white text-xs py-2 px-4">
        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>✨ مرحباً بكم في {{ storefront.settings()?.store_name || 'منصة أصالة للتسوق والتوصيل السريع' }}</span>
          <div class="flex items-center gap-4">
            <a routerLink="/become-seller" class="hover:underline font-semibold">سجل كشريك / تاجر</a>
            <a routerLink="/orders" class="hover:underline">تتبع طلباتك</a>
            <a routerLink="/contact-us" class="hover:underline">تواصل معنا</a>
          </div>
        </div>
      </div>

      <!-- Main Header -->
      <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm border-b border-amber-200/60">
        <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <!-- Brand Logo -->
          <a routerLink="/" class="flex items-center gap-3">
            <img
              [src]="storefront.settings()?.store_logo || '/assets/images/logo.png'"
              alt="شعار منصة أصالة"
              class="w-11 h-11 rounded-xl object-contain bg-amber-50 border border-amber-200 p-0.5 shadow-sm"
              onerror="this.src='/assets/images/logo.png'" />
            <div>
              <span class="text-xl font-extrabold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent block leading-none">
                {{ storefront.settings()?.store_name || 'منصة أصالة' }}
              </span>
              <span class="text-[11px] text-gray-500">متاجر • مطاعم • توصيل فوري</span>
            </div>
          </a>

          <!-- Search Bar -->
          <form (ngSubmit)="onSearch()" class="hidden md:flex flex-1 max-w-xl relative">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              name="q"
              placeholder="ابحث عن المنتجات، المتاجر، المطاعم..."
              class="input pr-4 pl-20 py-2.5 rounded-full border-amber-300" />
            <button
              type="submit"
              class="absolute left-1.5 top-1.5 bottom-1.5 px-4 rounded-full bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition">
              بحث
            </button>
          </form>

          <!-- User & Cart Actions -->
          <div class="flex items-center gap-3">
            <a
              routerLink="/wishlist"
              class="relative p-2.5 rounded-full hover:bg-amber-50 text-gray-700 transition"
              title="المفضلة">
              ♥
              @if (cart.wishlistIds().size > 0) {
                <span class="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {{ cart.wishlistIds().size }}
                </span>
              }
            </a>

            <button
              type="button"
              (click)="cart.isCartSidebarOpen.set(true)"
              class="relative p-2.5 rounded-full hover:bg-amber-50 text-gray-700 transition"
              title="سلة التسوق">
              🛒
              @if (cart.count() > 0) {
                <span class="absolute -top-0.5 -right-0.5 bg-amber-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {{ cart.count() }}
                </span>
              }
            </button>

            @if (auth.isAuthenticated()) {
              <div class="flex items-center gap-2">
                @if (auth.currentUser()?.role === 'admin') {
                  <a routerLink="/admin/dashboard" class="text-xs px-3 py-1.5 rounded-lg bg-purple-100 text-purple-800 font-bold hover:bg-purple-200">
                    لوحة الإدارة
                  </a>
                } @else if (auth.currentUser()?.role === 'seller') {
                  <a routerLink="/seller/dashboard" class="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200">
                    لوحة المتجر
                  </a>
                } @else if (auth.currentUser()?.role === 'driver') {
                  <a routerLink="/driver/dashboard" class="text-xs px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800 font-bold hover:bg-blue-200">
                    لوحة المندوب
                  </a>
                }
                <a routerLink="/account" class="text-sm font-bold text-gray-800 hover:text-amber-700 px-2">
                  👤 {{ auth.currentUser()?.name }}
                </a>
                <button (click)="auth.logout()" class="text-xs text-rose-600 hover:underline px-2">خروج</button>
              </div>
            } @else {
              <a routerLink="/login" class="btn btn-outline text-xs py-2 px-3">دخول</a>
              <a routerLink="/register" class="btn btn-primary text-xs py-2 px-3">حساب جديد</a>
            }
          </div>
        </div>

        <!-- Navigation Links -->
        <nav class="bg-amber-50/70 border-t border-amber-100 px-4 py-2">
          <div class="max-w-7xl mx-auto flex items-center gap-6 overflow-x-auto text-sm font-semibold text-gray-700">
            <a routerLink="/" routerLinkActive="text-amber-700 font-extrabold" [routerLinkActiveOptions]="{exact: true}" class="hover:text-amber-600 whitespace-nowrap">الرئيسية</a>
            <a routerLink="/products" routerLinkActive="text-amber-700 font-extrabold" class="hover:text-amber-600 whitespace-nowrap">المنتجات</a>
            <a routerLink="/categories" routerLinkActive="text-amber-700 font-extrabold" class="hover:text-amber-600 whitespace-nowrap">الأقسام</a>
            <a routerLink="/sellers" routerLinkActive="text-amber-700 font-extrabold" class="hover:text-amber-600 whitespace-nowrap">المتاجر والمطاعم</a>
            <a routerLink="/offers" routerLinkActive="text-amber-700 font-extrabold" class="hover:text-amber-600 whitespace-nowrap">العروض والخصومات 🔥</a>
            <a routerLink="/coupons" routerLinkActive="text-amber-700 font-extrabold" class="hover:text-amber-600 whitespace-nowrap">الكوبونات 🎟️</a>
            <a routerLink="/orders" routerLinkActive="text-amber-700 font-extrabold" class="hover:text-amber-600 whitespace-nowrap">طلباتي</a>
            <a routerLink="/about-us" routerLinkActive="text-amber-700 font-extrabold" class="hover:text-amber-600 whitespace-nowrap">من نحن</a>
          </div>
        </nav>
      </header>

      <!-- Main Content -->
      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>

      <!-- Slide-Over Cart Sidebar -->
      @if (cart.isCartSidebarOpen()) {
        <div class="fixed inset-0 z-50 flex">
          <div class="fixed inset-0 bg-black/40" (click)="cart.isCartSidebarOpen.set(false)"></div>
          <div class="relative z-10 mr-auto w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
            <div class="p-4 border-b border-amber-100 flex items-center justify-between bg-amber-50">
              <h3 class="font-extrabold text-lg text-gray-900">سلة التسوق ({{ cart.count() }})</h3>
              <button (click)="cart.isCartSidebarOpen.set(false)" class="text-gray-500 hover:text-gray-800 text-xl">✕</button>
            </div>

            <div class="flex-1 overflow-y-auto p-4 space-y-3">
              @if (cart.items().length === 0) {
                <div class="text-center py-16 text-gray-500">
                  <p class="text-4xl mb-3">🛒</p>
                  <p class="font-semibold">سلة التسوق فارغة حالياً</p>
                </div>
              } @else {
                @for (item of cart.items(); track item.id) {
                  <div class="flex items-center justify-between gap-3 p-3 rounded-xl border border-amber-100 bg-amber-50/30">
                    <div class="flex-1">
                      <p class="font-bold text-sm text-gray-900">{{ item.product?.name || 'منتج' }}</p>
                      <p class="text-xs text-amber-700 font-semibold">
                        {{ (item.unit_price || item.price || item.product?.price || 0) | number:'1.0-2' }} ر.ي × {{ item.quantity }}
                      </p>
                    </div>
                    <div class="flex items-center gap-1">
                      <button (click)="cart.updateQuantity(item.id, item.quantity - 1).subscribe()" [disabled]="item.quantity <= 1" class="px-2 py-0.5 bg-gray-200 rounded">-</button>
                      <span class="px-2 text-sm font-bold">{{ item.quantity }}</span>
                      <button (click)="cart.updateQuantity(item.id, item.quantity + 1).subscribe()" class="px-2 py-0.5 bg-amber-200 rounded">+</button>
                      <button (click)="cart.removeItem(item.id).subscribe()" class="text-rose-600 text-xs mr-2">حذف</button>
                    </div>
                  </div>
                }
              }
            </div>

            @if (cart.items().length > 0) {
              <div class="p-4 border-t border-amber-100 bg-gray-50 space-y-3">
                <div class="flex items-center justify-between font-extrabold text-gray-900">
                  <span>الإجمالي الفرعي:</span>
                  <span class="text-amber-700 text-lg">{{ cart.total() | number:'1.0-2' }} ر.ي</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <a routerLink="/cart" (click)="cart.isCartSidebarOpen.set(false)" class="btn btn-outline w-full">عرض السلة</a>
                  <a routerLink="/checkout" (click)="cart.isCartSidebarOpen.set(false)" class="btn btn-primary w-full">إتمام الطلب</a>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Footer -->
      <footer class="bg-gray-900 text-gray-300 pt-12 pb-8 mt-16 border-t-4 border-amber-500">
        <div class="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h4 class="text-white font-extrabold text-lg mb-3">{{ storefront.settings()?.store_name || 'منصة أصالة' }}</h4>
            <p class="text-sm text-gray-400 leading-relaxed">
              {{ storefront.settings()?.store_description || 'منصتك المتكاملة للتسوق من أفضل المتاجر والمطاعم مع خدمة توصيل سريعة وآمنة.' }}
            </p>
          </div>
          <div>
            <h4 class="text-white font-bold mb-3">روابط سريعة</h4>
            <ul class="space-y-2 text-sm">
              <li><a routerLink="/products" class="hover:text-amber-400">تصفح المنتجات</a></li>
              <li><a routerLink="/sellers" class="hover:text-amber-400">المتاجر والمطاعم</a></li>
              <li><a routerLink="/offers" class="hover:text-amber-400">العروض الخاصة</a></li>
              <li><a routerLink="/coupons" class="hover:text-amber-400">كوبونات الخصم</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-bold mb-3">السياسات والدعم</h4>
            <ul class="space-y-2 text-sm">
              <li><a routerLink="/policy/privacy_policy" class="hover:text-amber-400">سياسة الخصوصية</a></li>
              <li><a routerLink="/policy/return_policy" class="hover:text-amber-400">سياسة الاستبدال والاسترجاع</a></li>
              <li><a routerLink="/policy/shipping_policy" class="hover:text-amber-400">سياسة الشحن والتوصيل</a></li>
              <li><a routerLink="/contact-us" class="hover:text-amber-400">تواصل معنا</a></li>
            </ul>
          </div>
          <div>
            <h4 class="text-white font-bold mb-3">معلومات التواصل</h4>
            <p class="text-sm text-gray-400 mb-1">📞 {{ storefront.settings()?.store_phone || '+967 777 000 000' }}</p>
            <p class="text-sm text-gray-400 mb-1">✉️ {{ storefront.settings()?.store_email || 'info@asalah-store.com' }}</p>
            <p class="text-sm text-gray-400">📍 {{ storefront.settings()?.store_address || 'صنعاء - اليمن' }}</p>
          </div>
        </div>
        <div class="max-w-7xl mx-auto px-4 mt-8 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
          جميع الحقوق محفوظة © {{ currentYear }} {{ storefront.settings()?.store_name || 'منصة أصالة' }} (Angular & ASP.NET Core 8 Edition)
        </div>
      </footer>
    </div>
  `
})
export class CustomerLayoutComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly cart = inject(CartService);
  readonly storefront = inject(StorefrontService);
  readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  searchQuery = '';
  currentYear = new Date().getFullYear();

  ngOnInit(): void {
    this.storefront.loadSettings().subscribe({ error: () => {} });
    this.storefront.getActivities().subscribe({ error: () => {} });
    if (this.auth.isAuthenticated()) {
      this.cart.loadCart().subscribe({ error: () => {} });
      this.cart.getWishlist().subscribe({ error: () => {} });
    }
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/products'], { queryParams: { search: this.searchQuery.trim() } });
    }
  }
}

