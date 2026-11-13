import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StorefrontService } from '../../../../core/services/storefront.service';
import { CartService } from '../../../../core/services/cart.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Activity, Banner, Category, Coupon, Offer, Product, Seller } from '../../../../core/models/models';
import { ProductCardComponent } from '../../../../shared/components/product-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ProductCardComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-6 space-y-10">
      <!-- Dynamic Multi-Activity Switcher Tabs -->
      <div class="flex items-center justify-center gap-3 flex-wrap">
        <button
          type="button"
          (click)="switchActivity('store')"
          [class]="activeTab() === 'store' ? 'btn btn-primary px-6 py-3 font-extrabold' : 'btn btn-outline px-6 py-3 font-bold bg-white'">
          🛍️ المتاجر والتسوق
        </button>
        <button
          type="button"
          (click)="switchActivity('restaurant')"
          [class]="activeTab() === 'restaurant' ? 'btn btn-primary px-6 py-3 font-extrabold' : 'btn btn-outline px-6 py-3 font-bold bg-white'">
          🍔 المطاعم والكافيهات
        </button>
        @for (act of activities(); track act.id) {
          @if (act.slug !== 'store' && act.slug !== 'stores' && act.slug !== 'restaurant' && act.slug !== 'restaurants') {
            <button
              type="button"
              (click)="switchActivity(act.slug)"
              [class]="activeTab() === act.slug ? 'btn btn-primary px-6 py-3 font-extrabold' : 'btn btn-outline px-6 py-3 font-bold bg-white'">
              ✨ {{ act.name }}
            </button>
          }
        }
      </div>

      <!-- Hero Banner Carousel -->
      @if (banners().length > 0) {
        <div class="relative rounded-2xl overflow-hidden shadow-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white min-h-[260px] flex items-center">
          <img
            [src]="banners()[currentBannerIndex()].image_url"
            [alt]="banners()[currentBannerIndex()].title"
            class="absolute inset-0 w-full h-full object-cover opacity-40"
            onerror="this.style.display='none'" />
          <div class="relative z-10 p-8 md:p-12 max-w-2xl space-y-4">
            <h2 class="text-2xl md:text-4xl font-extrabold">{{ banners()[currentBannerIndex()].title || 'عروض منصة أصالة الحصرية' }}</h2>
            <p class="text-sm md:text-base text-amber-100">{{ banners()[currentBannerIndex()].description }}</p>
            @if (banners()[currentBannerIndex()].link_url) {
              <a [routerLink]="banners()[currentBannerIndex()].link_url" class="btn bg-white text-amber-800 font-bold hover:bg-amber-50">
                {{ banners()[currentBannerIndex()].link_text || 'تسوق الآن' }}
              </a>
            }
          </div>
        </div>
      }

      <!-- Categories Strip -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-extrabold text-gray-900">الأقسام والتصنيفات</h3>
          <a routerLink="/categories" class="text-sm text-amber-700 font-bold hover:underline">عرض الكل ←</a>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          @for (cat of categories(); track cat.id) {
            <a
              [routerLink]="['/products']"
              [queryParams]="{ category: cat.slug, type: activeTab() }"
              class="card p-4 text-center hover:border-amber-400 hover:shadow-md transition group">
              <div class="w-16 h-16 mx-auto mb-2 rounded-full bg-amber-100 overflow-hidden flex items-center justify-center text-amber-700 font-bold text-lg group-hover:scale-110 transition border border-amber-200">
                @if (cat.image || cat.image_url) {
                  <img [src]="cat.image || cat.image_url" [alt]="cat.name" class="w-full h-full object-cover" onerror="this.style.display='none'" />
                } @else {
                  <span>{{ cat.name.slice(0, 1) }}</span>
                }
              </div>
              <h4 class="font-bold text-sm text-gray-800 line-clamp-1">{{ cat.name }}</h4>
              <span class="text-[11px] text-gray-400">{{ cat.products_count || 0 }} منتج</span>
            </a>
          }
        </div>
      </section>

      <!-- Stores / Restaurants Section -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-extrabold text-gray-900">
            {{ activeTab() === 'restaurant' ? 'أبرز المطاعم والكافيهات' : 'أبرز المتاجر المعتمدة' }}
          </h3>
          <a routerLink="/sellers" [queryParams]="{ type: activeTab() }" class="text-sm text-amber-700 font-bold hover:underline">عرض الكل ←</a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          @for (s of sellers(); track s.id) {
            <a
              [routerLink]="[s.type === 'restaurant' || s.type === 'restaurants' ? '/restaurant' : '/seller', s.id]"
              class="card hover:shadow-xl transition overflow-hidden flex flex-col">
              <div class="h-32 bg-gradient-to-r from-amber-500 to-orange-500 relative">
                @if (s.cover_image) {
                  <img [src]="s.cover_image" class="w-full h-full object-cover" onerror="this.style.display='none'" />
                }
                @if (s.logo || s.avatar || s.avatar_image) {
                  <img [src]="s.logo || s.avatar || s.avatar_image" [alt]="s.name || s.store_name"
                       class="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md absolute -bottom-6 right-4 bg-white"
                       onerror="this.style.display='none'" />
                }
                <span
                  [class]="s.is_open ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'"
                  class="absolute top-2 left-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  {{ s.is_open ? 'مفتوح الآن' : 'مغلق' }}
                </span>
              </div>
              <div class="p-4 pt-8 flex-1 flex flex-col justify-between">
                <div>
                  <h4 class="font-extrabold text-gray-900 text-base">{{ s.name || s.store_name }}</h4>
                  <p class="text-xs text-gray-500 line-clamp-2 mt-1">{{ s.description }}</p>
                </div>
                <div class="flex items-center justify-between text-xs text-gray-600 mt-3 pt-2 border-t border-amber-100">
                  <span>⭐ {{ s.rating || 0 }} ({{ s.reviews_count || 0 }})</span>
                  <span>⏱️ {{ s.preparation_time || s.delivery_time || '30 دقيقة' }}</span>
                </div>
              </div>
            </a>
          }
        </div>
      </section>

      <!-- Products / Meals Grid -->
      <section>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-extrabold text-gray-900">
            {{ activeTab() === 'restaurant' ? 'أشهى الوجبات والأطباق' : 'أحدث المنتجات المختارة' }}
          </h3>
          <a routerLink="/products" [queryParams]="{ type: activeTab() }" class="text-sm text-amber-700 font-bold hover:underline">عرض الكل ←</a>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          @for (prod of products(); track prod.id) {
            <app-product-card [product]="prod"></app-product-card>
          }
        </div>
      </section>
    </div>
  `
})
export class HomeComponent implements OnInit {
  private readonly storefront = inject(StorefrontService);
  private readonly route = inject(ActivatedRoute);

  readonly activeTab = signal<string>('store');
  readonly activities = signal<Activity[]>([]);
  readonly banners = signal<Banner[]>([]);
  readonly currentBannerIndex = signal<number>(0);
  readonly categories = signal<Category[]>([]);
  readonly sellers = signal<Seller[]>([]);
  readonly products = signal<Product[]>([]);

  ngOnInit(): void {
    this.storefront.getActivities().subscribe({
      next: (res) => this.activities.set(res?.data || []),
      error: () => {}
    });

    this.route.queryParams.subscribe((params) => {
      const tab = params['tab'] === 'restaurants' ? 'restaurant' : (params['tab'] || 'store');
      this.switchActivity(tab);
    });
  }

  switchActivity(type: string) {
    this.activeTab.set(type);
    this.storefront.getBanners('home', type).subscribe({
      next: (res) => this.banners.set(res?.data || []),
      error: () => {}
    });
    this.storefront.getCategories(type).subscribe({
      next: (cats) => this.categories.set(cats || []),
      error: () => {}
    });
    if (type === 'restaurant') {
      this.storefront.getRestaurants().subscribe({
        next: (list) => this.sellers.set((list || []).slice(0, 8)),
        error: () => {}
      });
    } else {
      this.storefront.getSellers(type).subscribe({
        next: (list) => this.sellers.set((list || []).slice(0, 8)),
        error: () => {}
      });
    }
    this.storefront.getProducts({ type, per_page: 12 }).subscribe({
      next: (res) => this.products.set(res?.data || []),
      error: () => {}
    });
  }
}
