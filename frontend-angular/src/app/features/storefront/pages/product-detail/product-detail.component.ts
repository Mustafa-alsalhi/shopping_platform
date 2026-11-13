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
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-white via-amber-50/20 to-orange-50/10" dir="rtl">
      <!-- Breadcrumb -->
      <nav class="bg-white/85 backdrop-blur-sm border-b border-amber-200/50">
        <div class="max-w-7xl mx-auto px-4 py-3">
          <div class="flex items-center gap-2 text-xs sm:text-sm overflow-x-auto whitespace-nowrap">
            <a routerLink="/" class="text-gray-600 hover:text-amber-600 transition-colors">الرئيسية</a>
            <span class="text-gray-400">/</span>
            <a routerLink="/products" class="text-gray-600 hover:text-amber-600 transition-colors">المنتجات</a>
            @if (product()?.category; as cat) {
              <span class="text-gray-400">/</span>
              <a [routerLink]="['/products']" [queryParams]="{ category: cat.slug || cat.id }" class="text-gray-600 hover:text-amber-600 transition-colors">
                {{ cat.name }}
              </a>
            }
            <span class="text-gray-400">/</span>
            <span class="text-amber-900 font-bold truncate">{{ product()?.name || 'تفاصيل المنتج' }}</span>
          </div>
        </div>
      </nav>

      @if (loading()) {
        <!-- Skeleton Loading -->
        <div class="max-w-7xl mx-auto px-4 py-8">
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div class="xl:col-span-5 bg-white/80 rounded-2xl p-6 border border-amber-100 space-y-4">
              <div class="h-80 sm:h-96 bg-gray-200 rounded-xl animate-pulse"></div>
              <div class="flex gap-3">
                <div class="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                <div class="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
                <div class="w-20 h-20 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
            <div class="xl:col-span-4 bg-white/80 rounded-2xl p-6 border border-amber-100 space-y-4">
              <div class="h-8 bg-gray-200 rounded animate-pulse w-3/4"></div>
              <div class="h-6 bg-gray-200 rounded animate-pulse w-1/2"></div>
              <div class="h-10 bg-gray-200 rounded animate-pulse w-1/3"></div>
              <div class="h-24 bg-gray-200 rounded animate-pulse"></div>
              <div class="h-12 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div class="xl:col-span-3 bg-white/80 rounded-2xl p-6 border border-amber-100 space-y-4">
              <div class="h-16 bg-gray-200 rounded-xl animate-pulse"></div>
              <div class="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
              <div class="h-10 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      } @else if (errorMessage()) {
        <div class="max-w-2xl mx-auto px-4 py-16 text-center card p-8 space-y-4 mt-8">
          <p class="text-5xl">⚠️</p>
          <h2 class="text-xl font-extrabold text-gray-900">{{ errorMessage() }}</h2>
          <a routerLink="/products" class="btn btn-primary inline-flex">العودة إلى المنتجات</a>
        </div>
      } @else {
        @if (product(); as p) {
          <div class="max-w-7xl mx-auto px-4 py-6 lg:py-8">
            <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">

              <!-- Column 1: Gallery + Tabs (Overview & Reviews) -->
              <div class="xl:col-span-5 space-y-6">
                <!-- Gallery Card -->
                <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md p-4 sm:p-6 border border-amber-200/40">
                  <div class="relative overflow-hidden rounded-xl bg-amber-50/40 cursor-zoom-in group h-[280px] sm:h-[360px] md:h-[400px]">
                    <img
                      [src]="activeImageUrl()"
                      [alt]="p.name"
                      class="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-125"
                      [style.transformOrigin]="zoomOrigin()"
                      (mousemove)="onImageMouseMove($event)"
                      (mouseleave)="onImageMouseLeave()"
                      onerror="this.src='/assets/images/placeholder-product.png'" />

                    @if (allImages().length > 1) {
                      <!-- Image Counter -->
                      <div class="absolute top-3 right-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                        {{ selectedImageIndex() + 1 }} / {{ allImages().length }}
                      </div>

                      <!-- Next / Prev Arrows -->
                      <button
                        type="button"
                        (click)="prevImage()"
                        class="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-amber-800 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-amber-50"
                        title="الصورة السابقة">
                        ‹
                      </button>
                      <button
                        type="button"
                        (click)="nextImage()"
                        class="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 text-amber-800 shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-amber-50"
                        title="الصورة التالية">
                        ›
                      </button>
                    }

                    <!-- Discount Badge -->
                    @if (discountPercent() > 0) {
                      <div class="absolute bottom-3 right-3 bg-rose-600 text-white px-3 py-1 rounded-full text-xs font-extrabold shadow">
                        خصم {{ discountPercent() }}%
                      </div>
                    }

                    <!-- Share & Wishlist Floating Actions -->
                    <div class="absolute top-3 left-3 flex flex-col gap-2">
                      <button
                        type="button"
                        (click)="shareProduct()"
                        class="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-amber-600 hover:bg-amber-50 transition hover:scale-110"
                        title="مشاركة المنتج">
                        🔗
                      </button>
                      <button
                        type="button"
                        (click)="toggleWishlist()"
                        class="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center transition hover:scale-110"
                        [class.text-rose-600]="isWishlisted()"
                        [class.text-gray-500]="!isWishlisted()"
                        [title]="isWishlisted() ? 'إزالة من المفضلة' : 'إضافة للمفضلة'">
                        {{ isWishlisted() ? '❤️' : '🤍' }}
                      </button>
                    </div>
                  </div>

                  <!-- Thumbnails -->
                  @if (allImages().length > 1) {
                    <div class="flex gap-2.5 overflow-x-auto pt-4 pb-1">
                      @for (img of allImages(); track $index) {
                        <button
                          type="button"
                          (click)="selectedImageIndex.set($index)"
                          class="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden transition-all"
                          [class.ring-2]="selectedImageIndex() === $index"
                          [class.ring-amber-500]="selectedImageIndex() === $index"
                          [class.ring-offset-2]="selectedImageIndex() === $index"
                          [class.opacity-70]="selectedImageIndex() !== $index"
                          [class.hover:opacity-100]="selectedImageIndex() !== $index">
                          <img [src]="img" [alt]="p.name" class="w-full h-full object-cover" onerror="this.style.display='none'" />
                        </button>
                      }
                    </div>
                  }
                </div>

                <!-- Tabs Card: Overview & Reviews -->
                <div id="product-tabs-section" class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md p-4 sm:p-6 border border-amber-200/40">
                  <div class="flex gap-6 mb-5 border-b border-amber-200/50">
                    <button
                      type="button"
                      (click)="activeTab.set('overview')"
                      class="pb-3 font-bold text-sm transition-colors border-b-2"
                      [class.text-amber-900]="activeTab() === 'overview'"
                      [class.border-amber-600]="activeTab() === 'overview'"
                      [class.text-gray-500]="activeTab() !== 'overview'"
                      [class.border-transparent]="activeTab() !== 'overview'">
                      نظرة عامة والمواصفات
                    </button>
                    <button
                      type="button"
                      (click)="activeTab.set('reviews')"
                      class="pb-3 font-bold text-sm transition-colors border-b-2"
                      [class.text-amber-900]="activeTab() === 'reviews'"
                      [class.border-amber-600]="activeTab() === 'reviews'"
                      [class.text-gray-500]="activeTab() !== 'reviews'"
                      [class.border-transparent]="activeTab() !== 'reviews'">
                      التقييمات ({{ reviews().length || p.reviews_count || 0 }})
                    </button>
                  </div>

                  @if (activeTab() === 'overview') {
                    <div class="space-y-4">
                      <h3 class="text-base font-extrabold text-amber-900">الوصف التفصيلي</h3>
                      @if (p.detailed_description) {
                        <div class="text-gray-700 leading-relaxed text-sm prose prose-sm max-w-none" [innerHTML]="p.detailed_description"></div>
                      } @else {
                        <p class="text-gray-700 leading-relaxed text-sm">{{ p.description || 'لا يوجد وصف تفصيلي لهذا المنتج حتى الآن.' }}</p>
                      }

                      <div class="grid grid-cols-2 gap-3 pt-4 border-t border-amber-100 text-xs">
                        @if (p.category?.name) {
                          <div class="bg-amber-50/70 p-3 rounded-xl">
                            <span class="text-gray-500 block">القسم</span>
                            <span class="font-bold text-amber-900">{{ p.category?.name }}</span>
                          </div>
                        }
                        @if (p.sku) {
                          <div class="bg-amber-50/70 p-3 rounded-xl">
                            <span class="text-gray-500 block">رمز المنتج (SKU)</span>
                            <span class="font-bold text-amber-900">{{ p.sku }}</span>
                          </div>
                        }
                        <div class="bg-amber-50/70 p-3 rounded-xl">
                          <span class="text-gray-500 block">حالة المخزون</span>
                          <span class="font-bold" [class.text-emerald-700]="p.stock > 0" [class.text-rose-600]="p.stock <= 0">
                            {{ p.stock > 0 ? 'متوفر (' + p.stock + ')' : 'نفدت الكمية' }}
                          </span>
                        </div>
                        @if (p.preparation_time) {
                          <div class="bg-amber-50/70 p-3 rounded-xl">
                            <span class="text-gray-500 block">مدة التحضير</span>
                            <span class="font-bold text-amber-900">{{ p.preparation_time }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  } @else {
                    <div class="space-y-6">
                      <!-- Add Review Form -->
                      <div class="bg-amber-50/60 p-4 rounded-xl border border-amber-100">
                        <h4 class="text-sm font-extrabold text-amber-900 mb-3">أضف تقييمك</h4>
                        @if (auth.isAuthenticated()) {
                          <form (ngSubmit)="submitReview()" class="space-y-3">
                            <div>
                              <label class="block text-xs font-bold text-gray-700 mb-1">التقييم:</label>
                              <div class="flex items-center gap-1">
                                @for (star of [1, 2, 3, 4, 5]; track star) {
                                  <button
                                    type="button"
                                    (click)="newReview.rating = star"
                                    class="text-2xl transition-transform hover:scale-110 focus:outline-none"
                                    [class.text-amber-400]="star <= newReview.rating"
                                    [class.text-gray-300]="star > newReview.rating">
                                    ★
                                  </button>
                                }
                              </div>
                            </div>
                            <textarea
                              [(ngModel)]="newReview.comment"
                              name="comment"
                              rows="3"
                              required
                              class="input bg-white text-sm"
                              placeholder="كيف كانت تجربتك مع هذا المنتج؟"></textarea>
                            <button
                              type="submit"
                              [disabled]="submittingReview()"
                              class="btn btn-primary w-full py-2.5 text-xs font-bold">
                              {{ submittingReview() ? 'جاري الإرسال...' : 'إرسال التقييم' }}
                            </button>
                          </form>
                        } @else {
                          <div class="text-center py-4 bg-white rounded-xl border border-amber-100 space-y-2">
                            <p class="text-xs text-gray-600">لإضافة تقييم يرجى تسجيل الدخول أولاً</p>
                            <a routerLink="/login" class="btn btn-outline text-xs py-1.5 px-4 inline-flex">تسجيل الدخول</a>
                          </div>
                        }
                      </div>

                      <!-- Reviews List -->
                      <div class="space-y-3">
                        @if (reviews().length > 0) {
                          @for (rev of reviews(); track rev.id || $index) {
                            <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-2">
                              <div class="flex items-center justify-between">
                                <div class="flex items-center gap-2.5">
                                  @if (rev.user?.avatar) {
                                    <img [src]="rev.user.avatar" [alt]="rev.user?.name" class="w-9 h-9 rounded-full object-cover" />
                                  } @else {
                                    <div class="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                                      {{ (rev.user?.name || 'م').charAt(0) }}
                                    </div>
                                  }
                                  <div>
                                    <span class="font-bold text-gray-900 text-xs block">{{ rev.user?.name || 'عميل' }}</span>
                                    @if (rev.created_at) {
                                      <span class="text-[11px] text-gray-400">{{ rev.created_at | date:'mediumDate' }}</span>
                                    }
                                  </div>
                                </div>
                                <div class="flex items-center gap-0.5 bg-amber-50 px-2.5 py-1 rounded-full text-xs">
                                  @for (s of [1, 2, 3, 4, 5]; track s) {
                                    <span [class.text-amber-400]="s <= rev.rating" [class.text-gray-300]="s > rev.rating">★</span>
                                  }
                                </div>
                              </div>
                              @if (rev.comment) {
                                <p class="text-xs sm:text-sm text-gray-700 bg-gray-50 p-2.5 rounded-lg leading-relaxed">{{ rev.comment }}</p>
                              }
                            </div>
                          }
                        } @else {
                          <div class="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p class="text-gray-500 text-sm font-medium">لا توجد تقييمات حتى الآن، كن أول من يقيّم هذا المنتج!</p>
                          </div>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Column 2: Main Product Info & Related Products -->
              <div class="xl:col-span-4 space-y-6">
                <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md p-5 sm:p-6 border border-amber-200/40 space-y-5">
                  <!-- Badges -->
                  <div class="flex flex-wrap items-center gap-2">
                    @if (p.category?.name) {
                      <span class="text-[11px] font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                        {{ p.category?.name }}
                      </span>
                    }
                    <span
                      class="text-[11px] font-bold px-3 py-1 rounded-full"
                      [class.bg-emerald-100]="p.stock > 5"
                      [class.text-emerald-800]="p.stock > 5"
                      [class.bg-amber-100]="p.stock > 0 && p.stock <= 5"
                      [class.text-amber-800]="p.stock > 0 && p.stock <= 5"
                      [class.bg-rose-100]="p.stock <= 0"
                      [class.text-rose-800]="p.stock <= 0">
                      {{ p.stock > 5 ? 'متوفر في المخزون' : p.stock > 0 ? 'متبقي ' + p.stock + ' فقط' : 'نفدت الكمية' }}
                    </span>
                  </div>

                  <!-- Title & Rating -->
                  <div>
                    <h1 class="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent mb-2">
                      {{ p.name }}
                    </h1>
                    <button
                      type="button"
                      (click)="jumpToReviews()"
                      class="flex items-center gap-2 text-sm hover:opacity-80 transition">
                      <span class="flex items-center text-amber-400 text-base">
                        @for (s of [1, 2, 3, 4, 5]; track s) {
                          <span>{{ s <= (p.rating || 0) ? '★' : '☆' }}</span>
                        }
                      </span>
                      <span class="text-gray-600 text-xs font-semibold">
                        {{ p.rating || 0 }} ({{ p.reviews_count || reviews().length || 0 }} تقييم)
                      </span>
                    </button>
                  </div>

                  <!-- Price & Total -->
                  <div class="p-4 rounded-xl bg-amber-50/70 border border-amber-100 space-y-1">
                    <div class="flex items-baseline gap-3 flex-wrap">
                      <span class="text-3xl font-extrabold text-amber-700">
                        {{ effectiveUnitPrice() | number:'1.0-2' }} {{ p.currency || 'ر.ي' }}
                      </span>
                      @if (comparePrice() > effectiveUnitPrice()) {
                        <span class="text-base text-gray-400 line-through">
                          {{ comparePrice() | number:'1.0-2' }} {{ p.currency || 'ر.ي' }}
                        </span>
                      }
                    </div>
                    <p class="text-sm font-bold text-emerald-700">
                      الإجمالي ({{ quantity }}): {{ effectiveTotalPrice() | number:'1.0-2' }} {{ p.currency || 'ر.ي' }}
                    </p>
                  </div>

                  <!-- Short Description -->
                  @if (p.description) {
                    <div>
                      <h3 class="text-sm font-extrabold text-amber-900 mb-1">الوصف</h3>
                      <p class="text-gray-700 text-sm leading-relaxed">{{ p.description }}</p>
                    </div>
                  }

                  <!-- Store Variants (ProductVariants / JSON variants) -->
                  @if (normalizedVariants().length > 0) {
                    <div class="space-y-4 pt-3 border-t border-amber-100">
                      <h3 class="text-sm font-extrabold text-amber-900">خيارات ومتغيرات المنتج</h3>
                      @for (v of normalizedVariants(); track v.name + $index) {
                        <div class="space-y-2">
                          <label class="block text-xs font-bold text-gray-700">
                            {{ v.name }}
                            @if (selectedVariantOptions()[v.name]; as chosen) {
                              <span class="text-amber-700 mr-1">: {{ chosen.label }}</span>
                            }
                          </label>
                          <div class="flex flex-wrap gap-2">
                            @for (opt of v.options; track opt.label + $index) {
                              <button
                                type="button"
                                (click)="selectVariantOption(v.name, opt)"
                                [disabled]="opt.stock !== undefined && opt.stock !== null && opt.stock <= 0"
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition disabled:opacity-40"
                                [class.bg-amber-600]="selectedVariantOptions()[v.name]?.label === opt.label"
                                [class.text-white]="selectedVariantOptions()[v.name]?.label === opt.label"
                                [class.border-amber-600]="selectedVariantOptions()[v.name]?.label === opt.label"
                                [class.bg-white]="selectedVariantOptions()[v.name]?.label !== opt.label"
                                [class.text-gray-700]="selectedVariantOptions()[v.name]?.label !== opt.label"
                                [class.border-gray-200]="selectedVariantOptions()[v.name]?.label !== opt.label">
                                @if (opt.color_code) {
                                  <span class="w-3.5 h-3.5 rounded-full border border-black/15" [style.backgroundColor]="opt.color_code"></span>
                                }
                                <span>{{ opt.label }}</span>
                                @if (opt.price_delta > 0) {
                                  <span class="opacity-85">(+{{ opt.price_delta | number:'1.0-2' }})</span>
                                }
                              </button>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }

                  <!-- Restaurant / Food Options (Sizes, Paid Extras, Removals, Special Instructions) -->
                  @if (foodSizes().length > 0 || foodExtras().length > 0 || foodRemovals().length > 0 || isRestaurantProduct()) {
                    <div class="space-y-4 pt-3 border-t border-amber-100">
                      @if (foodSizes().length > 0) {
                        <div class="space-y-2">
                          <div class="flex items-center justify-between">
                            <h3 class="text-sm font-extrabold text-amber-900">اختر الحجم</h3>
                            <span class="text-[11px] text-amber-600 font-semibold">يحدد السعر الأساسي</span>
                          </div>
                          <div class="space-y-2">
                            @for (sz of foodSizes(); track sz.name + $index) {
                              <button
                                type="button"
                                (click)="selectFoodSize(sz)"
                                class="w-full flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm transition"
                                [class.border-amber-500]="selectedFoodSize()?.name === sz.name"
                                [class.bg-amber-50]="selectedFoodSize()?.name === sz.name"
                                [class.font-extrabold]="selectedFoodSize()?.name === sz.name"
                                [class.text-amber-900]="selectedFoodSize()?.name === sz.name"
                                [class.border-gray-200]="selectedFoodSize()?.name !== sz.name"
                                [class.bg-white]="selectedFoodSize()?.name !== sz.name"
                                [class.text-gray-700]="selectedFoodSize()?.name !== sz.name">
                                <span class="flex items-center gap-2">
                                  <span
                                    class="w-4 h-4 rounded-full border flex items-center justify-center"
                                    [class.border-amber-600]="selectedFoodSize()?.name === sz.name"
                                    [class.bg-amber-600]="selectedFoodSize()?.name === sz.name"
                                    [class.border-gray-300]="selectedFoodSize()?.name !== sz.name">
                                    @if (selectedFoodSize()?.name === sz.name) {
                                      <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                                    }
                                  </span>
                                  <span>{{ sz.name }}</span>
                                </span>
                                <span class="font-bold text-amber-700">{{ sz.price | number:'1.0-2' }} {{ p.currency || 'ر.ي' }}</span>
                              </button>
                            }
                          </div>
                        </div>
                      }

                      @if (foodExtras().length > 0) {
                        <div class="space-y-2">
                          <div class="flex items-center justify-between">
                            <h3 class="text-sm font-extrabold text-amber-900">إضافات مميزة</h3>
                            <span class="text-[11px] text-gray-500">اختياري</span>
                          </div>
                          <div class="space-y-2">
                            @for (ex of foodExtras(); track ex.name + $index) {
                              <button
                                type="button"
                                (click)="toggleFoodExtra(ex)"
                                class="w-full flex items-center justify-between p-3 rounded-xl border text-xs sm:text-sm transition"
                                [class.border-amber-500]="isExtraSelected(ex.name)"
                                [class.bg-amber-50]="isExtraSelected(ex.name)"
                                [class.font-bold]="isExtraSelected(ex.name)"
                                [class.border-gray-200]="!isExtraSelected(ex.name)"
                                [class.bg-white]="!isExtraSelected(ex.name)">
                                <span class="flex items-center gap-2">
                                  <span
                                    class="w-4 h-4 rounded border flex items-center justify-center text-[10px]"
                                    [class.bg-amber-600]="isExtraSelected(ex.name)"
                                    [class.border-amber-600]="isExtraSelected(ex.name)"
                                    [class.text-white]="isExtraSelected(ex.name)"
                                    [class.border-gray-300]="!isExtraSelected(ex.name)">
                                    @if (isExtraSelected(ex.name)) {
                                      <span>✓</span>
                                    }
                                  </span>
                                  <span>{{ ex.name }}</span>
                                </span>
                                <span class="font-bold text-amber-600">+{{ ex.price | number:'1.0-2' }} {{ p.currency || 'ر.ي' }}</span>
                              </button>
                            }
                          </div>
                        </div>
                      }

                      @if (foodRemovals().length > 0) {
                        <div class="space-y-2">
                          <h3 class="text-sm font-extrabold text-amber-900">تفضيلات خاصة (بدون مكونات)</h3>
                          <div class="flex flex-wrap gap-2">
                            @for (rem of foodRemovals(); track rem + $index) {
                              <button
                                type="button"
                                (click)="toggleFoodRemoval(rem)"
                                class="px-3 py-1.5 rounded-full text-xs font-bold border transition"
                                [class.border-rose-500]="selectedFoodRemovals().includes(rem)"
                                [class.bg-rose-50]="selectedFoodRemovals().includes(rem)"
                                [class.text-rose-700]="selectedFoodRemovals().includes(rem)"
                                [class.border-gray-200]="!selectedFoodRemovals().includes(rem)"
                                [class.bg-gray-50]="!selectedFoodRemovals().includes(rem)"
                                [class.text-gray-600]="!selectedFoodRemovals().includes(rem)">
                                {{ rem }}
                              </button>
                            }
                          </div>
                        </div>
                      }

                      @if (isRestaurantProduct()) {
                        <div class="space-y-1.5">
                          <label class="block text-xs font-extrabold text-amber-900">ملاحظات خاصة للطلب / المطبخ</label>
                          <textarea
                            [(ngModel)]="specialInstructions"
                            rows="2"
                            class="input bg-white text-xs sm:text-sm"
                            placeholder="مثال: بدون شطة، تسخين جيد، صوص جانبي..."></textarea>
                        </div>
                      }
                    </div>
                  }

                  <!-- Quantity & Actions -->
                  <div class="space-y-3 pt-3 border-t border-amber-100">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-gray-700">الكمية:</span>
                      <div class="flex items-center border border-amber-300 rounded-xl overflow-hidden bg-white">
                        <button type="button" (click)="changeQuantity(-1)" [disabled]="quantity <= 1" class="px-3.5 py-2 bg-amber-50 font-bold text-amber-800 disabled:opacity-40">-</button>
                        <span class="px-5 py-2 font-extrabold text-sm min-w-[48px] text-center">{{ quantity }}</span>
                        <button type="button" (click)="changeQuantity(1)" class="px-3.5 py-2 bg-amber-50 font-bold text-amber-800">+</button>
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      <button
                        type="button"
                        (click)="toggleWishlist()"
                        class="p-3 rounded-xl border transition hover:scale-105"
                        [class.bg-rose-50]="isWishlisted()"
                        [class.border-rose-200]="isWishlisted()"
                        [class.text-rose-600]="isWishlisted()"
                        [class.bg-amber-50]="!isWishlisted()"
                        [class.border-amber-200]="!isWishlisted()"
                        [class.text-amber-700]="!isWishlisted()"
                        title="المفضلة">
                        {{ isWishlisted() ? '❤️' : '🤍' }}
                      </button>
                      <button
                        type="button"
                        (click)="addToCart(false)"
                        [disabled]="p.stock <= 0"
                        class="btn btn-primary flex-1 py-3 font-extrabold text-sm shadow-md">
                        {{ p.stock <= 0 ? 'نفدت الكمية' : 'أضف للسلة 🛒' }}
                      </button>
                      <button
                        type="button"
                        (click)="addToCart(true)"
                        [disabled]="p.stock <= 0"
                        class="btn btn-outline py-3 px-4 font-bold text-xs sm:text-sm bg-white">
                        اشتري الآن
                      </button>
                    </div>
                  </div>

                  <!-- Trust Badges -->
                  <div class="grid grid-cols-3 gap-2 pt-3 border-t border-amber-100 text-center">
                    <div class="bg-amber-50/80 rounded-xl p-2.5">
                      <div class="text-lg mb-0.5">🚚</div>
                      <p class="text-[11px] font-bold text-amber-900">توصيل سريع</p>
                    </div>
                    <div class="bg-amber-50/80 rounded-xl p-2.5">
                      <div class="text-lg mb-0.5">🛡️</div>
                      <p class="text-[11px] font-bold text-amber-900">دفع آمن</p>
                    </div>
                    <div class="bg-amber-50/80 rounded-xl p-2.5">
                      <div class="text-lg mb-0.5">🔄</div>
                      <p class="text-[11px] font-bold text-amber-900">إرجاع سهل</p>
                    </div>
                  </div>
                </div>

                <!-- Related Products -->
                @if (relatedProducts().length > 0) {
                  <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md p-4 sm:p-5 border border-amber-200/40">
                    <div class="flex items-center justify-between mb-4">
                      <h3 class="text-base font-extrabold text-amber-900">منتجات ذات صلة</h3>
                      @if (relatedProducts().length > 4) {
                        <button
                          type="button"
                          (click)="showAllRelated.set(!showAllRelated())"
                          class="text-xs font-bold text-amber-600 hover:text-amber-700">
                          {{ showAllRelated() ? 'عرض أقل' : 'عرض الكل' }}
                        </button>
                      }
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                      @for (rp of displayedRelated(); track rp.id) {
                        <a [routerLink]="['/products', rp.id]" class="group block bg-white rounded-xl border border-amber-100 overflow-hidden hover:shadow-md transition">
                          <div class="aspect-square bg-amber-50 overflow-hidden">
                            <img [src]="rp.image || rp.image_url || '/assets/images/placeholder-product.png'" [alt]="rp.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src='/assets/images/placeholder-product.png'" />
                          </div>
                          <div class="p-2.5">
                            <h4 class="text-xs font-bold text-amber-900 truncate">{{ rp.name }}</h4>
                            <p class="text-xs font-extrabold text-amber-600 mt-1">{{ rp.price | number:'1.0-2' }} {{ rp.currency || 'ر.ي' }}</p>
                          </div>
                        </a>
                      }
                    </div>
                  </div>
                }
              </div>

              <!-- Column 3: Customer, Seller & More from Store -->
              <div class="xl:col-span-3 space-y-6">
                @if (auth.currentUser(); as u) {
                  <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md p-4 sm:p-5 border border-amber-200/40">
                    <h3 class="text-sm font-extrabold text-amber-900 mb-3">معلومات العميل</h3>
                    <div class="flex items-center gap-3">
                      @if (u.avatar) {
                        <img [src]="u.avatar" [alt]="u.name" class="w-12 h-12 rounded-full object-cover shadow" />
                      } @else {
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center font-extrabold text-lg shadow">
                          {{ u.name.charAt(0) }}
                        </div>
                      }
                      <div class="min-w-0">
                        <h4 class="font-bold text-gray-900 text-sm truncate">{{ u.name }}</h4>
                        <p class="text-xs text-gray-500 truncate">{{ u.email || u.phone }}</p>
                        <span class="inline-block text-[11px] font-bold text-amber-700">
                          {{ u.role === 'admin' ? 'مدير النظام' : u.role === 'seller' ? 'بائع' : 'عميل' }}
                        </span>
                      </div>
                    </div>
                  </div>
                }

                <!-- Seller Card -->
                @if (p.seller; as s) {
                  <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md p-4 sm:p-5 border border-amber-200/40 space-y-4">
                    <h3 class="text-sm font-extrabold text-amber-900">معلومات البائع</h3>
                    <div class="flex items-center gap-3">
                      <img
                        [src]="s.avatar || s.avatar_image || s.logo || '/assets/images/logo.png'"
                        [alt]="s.store_name || s.name"
                        class="w-14 h-14 rounded-full object-cover border border-amber-200 shadow-sm shrink-0"
                        onerror="this.src='/assets/images/logo.png'" />
                      <div class="min-w-0">
                        <h4 class="font-extrabold text-gray-900 text-sm truncate">{{ s.store_name || s.name }}</h4>
                        <p class="text-xs text-gray-600">{{ s.is_verified ? 'بائع موثوق ✅' : 'متجر مسجل' }}</p>
                        <div class="flex items-center gap-1 text-xs mt-0.5">
                          <span class="text-amber-400">★</span>
                          <span class="font-bold text-gray-800">{{ s.rating || 4.8 }}</span>
                          <span class="text-gray-400">({{ s.reviews_count || 0 }} تقييم)</span>
                        </div>
                      </div>
                    </div>
                    <p class="text-xs text-gray-600 leading-relaxed">
                      {{ s.description || 'متجر متخصص في بيع منتجات عالية الجودة مع خدمة عملاء ممتازة وتوصيل سريع.' }}
                    </p>
                    <div class="flex gap-2">
                      <a [routerLink]="['/chat', s.id]" class="btn btn-primary flex-1 py-2 text-xs font-bold text-center">
                        💬 مراسلة البائع
                      </a>
                      <a [routerLink]="['/seller', s.id]" class="btn btn-outline flex-1 py-2 text-xs font-bold text-center bg-white">
                        🏪 عرض المتجر
                      </a>
                    </div>
                  </div>
                }

                <!-- More from Store -->
                @if (storeProducts().length > 0) {
                  <div class="bg-white/90 backdrop-blur-sm rounded-2xl shadow-md p-4 sm:p-5 border border-amber-200/40">
                    <div class="flex items-center justify-between mb-3">
                      <h3 class="text-sm font-extrabold text-amber-900">المزيد من المتجر</h3>
                      <a [routerLink]="p.seller ? ['/seller', p.seller.id] : ['/products']" class="text-xs font-bold text-amber-600 hover:text-amber-700">
                        عرض الكل
                      </a>
                    </div>
                    <div class="grid grid-cols-2 gap-2.5">
                      @for (sp of storeProducts(); track sp.id) {
                        <a [routerLink]="['/products', sp.id]" class="group block bg-white rounded-xl border border-amber-100 overflow-hidden hover:shadow-md transition">
                          <div class="aspect-square bg-amber-50 overflow-hidden">
                            <img [src]="sp.image || sp.image_url || '/assets/images/placeholder-product.png'" [alt]="sp.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onerror="this.src='/assets/images/placeholder-product.png'" />
                          </div>
                          <div class="p-2">
                            <h4 class="text-[11px] font-bold text-amber-900 truncate">{{ sp.name }}</h4>
                            <p class="text-xs font-extrabold text-amber-600 mt-0.5">{{ sp.price | number:'1.0-2' }}</p>
                          </div>
                        </a>
                      }
                    </div>
                  </div>
                }
              </div>

            </div>
          </div>

          <!-- Cart Conflict Modal (Restaurant / Store mismatch) -->
          @if (conflictMessage()) {
            <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
                <div class="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl">⚠️</div>
                <h3 class="text-lg font-extrabold text-gray-900">تأكيد بدء طلب جديد</h3>
                <p class="text-sm text-gray-600 leading-relaxed">{{ conflictMessage() }}</p>
                <div class="flex gap-3 pt-2">
                  <button type="button" (click)="confirmForceClearCart()" class="btn btn-primary flex-1 py-2.5 font-bold">
                    نعم، إفراغ السلة والإضافة
                  </button>
                  <button type="button" (click)="conflictMessage.set(null)" class="btn btn-outline flex-1 py-2.5 font-semibold">
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          }
        }
      }
    </div>
  `
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly storefront = inject(StorefrontService);
  private readonly cart = inject(CartService);
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly product = signal<Product | null>(null);
  readonly selectedImageIndex = signal<number>(0);
  readonly zoomOrigin = signal<string>('center center');
  readonly activeTab = signal<'overview' | 'reviews'>('overview');
  readonly reviews = signal<any[]>([]);
  readonly relatedProducts = signal<Product[]>([]);
  readonly storeProducts = signal<Product[]>([]);
  readonly showAllRelated = signal<boolean>(false);
  readonly loading = signal<boolean>(true);
  readonly submittingReview = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly allImages = computed(() => {
    const p = this.product();
    if (!p) return ['/assets/images/placeholder-product.png'];
    const list: string[] = [];
    if (p.image) list.push(p.image);
    if (p.image_url) list.push(p.image_url);
    if (Array.isArray(p.images)) {
      for (const img of p.images) {
        if (img && typeof img === 'string') list.push(img);
      }
    }
    const unique = Array.from(new Set(list.filter((x) => x.trim() !== '')));
    return unique.length > 0 ? unique : ['/assets/images/placeholder-product.png'];
  });

  readonly activeImageUrl = computed(() => {
    const imgs = this.allImages();
    const idx = this.selectedImageIndex();
    return imgs[idx] || imgs[0] || '/assets/images/placeholder-product.png';
  });

  readonly comparePrice = computed(() => {
    const p = this.product();
    return Number(p?.compare_at_price || p?.old_price || 0);
  });

  readonly discountPercent = computed(() => {
    const p = this.product();
    const oldP = this.comparePrice();
    if (!p || oldP <= p.price) return 0;
    return Math.round(((oldP - p.price) / oldP) * 100);
  });

  readonly parsedFoodOptions = computed(() => {
    const p: any = this.product();
    if (!p) return null;
    const raw = p.food_options ?? p.addons;
    if (!raw) return null;
    if (typeof raw === 'string') {
      try { return JSON.parse(raw); } catch { return null; }
    }
    return raw;
  });

  readonly isRestaurantProduct = computed(() => {
    const p = this.product();
    if (!p) return false;
    const sellerType = (p.seller?.type || '').toLowerCase();
    const catType = (p.category?.type || '').toLowerCase();
    return (
      sellerType === 'restaurant' ||
      sellerType === 'restaurants' ||
      catType === 'restaurant' ||
      catType === 'restaurants' ||
      !!this.parsedFoodOptions() ||
      !!p.preparation_time
    );
  });

  readonly foodSizes = computed<{ name: string; price: number }[]>(() => {
    const fo = this.parsedFoodOptions();
    if (!fo || !Array.isArray(fo.sizes)) return [];
    return fo.sizes
      .filter((s: any) => s && (s.name || s.label))
      .map((s: any) => ({ name: s.name || s.label, price: Number(s.price || 0) }));
  });

  readonly foodExtras = computed<{ name: string; price: number }[]>(() => {
    const fo = this.parsedFoodOptions();
    if (!fo || !Array.isArray(fo.extras)) return [];
    return fo.extras
      .filter((e: any) => e && (e.name || e.label))
      .map((e: any) => ({ name: e.name || e.label, price: Number(e.price || 0) }));
  });

  readonly foodRemovals = computed<string[]>(() => {
    const fo = this.parsedFoodOptions();
    if (!fo || !Array.isArray(fo.removals)) return [];
    return fo.removals
      .map((r: any) => (typeof r === 'string' ? r : r?.name || r?.label || ''))
      .filter((r: string) => r.trim() !== '');
  });

  readonly normalizedVariants = computed(() => {
    const p: any = this.product();
    let raw = p?.variants;
    if (!raw) return [] as { name: string; options: { label: string; price_delta: number; color_code?: string; stock?: number; image?: string }[] }[];
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch { return []; }
    }
    if (!Array.isArray(raw) || raw.length === 0) return [];

    const hasNestedOptions = raw.some((v: any) => Array.isArray(v?.options) && v.options.length > 0);
    if (hasNestedOptions) {
      return raw.map((v: any) => ({
        name: v.name || 'خيار',
        options: (v.options || []).map((o: any) => ({
          label: String(o.value || o.name || ''),
          price_delta: Number(o.price_delta ?? o.price ?? 0),
          color_code: o.color_code || o.hex_code,
          stock: o.stock,
          image: o.image
        }))
      }));
    }

    // Legacy flat variants grouped by variant name
    const grouped = new Map<string, { label: string; price_delta: number; color_code?: string; stock?: number; image?: string }[]>();
    for (const v of raw) {
      const groupName = v.name || 'خيار';
      const label = String(v.value || v.label || v.name || '');
      if (!grouped.has(groupName)) grouped.set(groupName, []);
      grouped.get(groupName)!.push({
        label,
        price_delta: Number(v.price_delta ?? v.price ?? 0),
        color_code: v.color_code || v.hex_code,
        stock: v.stock,
        image: v.image
      });
    }
    return Array.from(grouped.entries()).map(([name, options]) => ({ name, options }));
  });

  readonly selectedVariantOptions = signal<Record<string, { label: string; price_delta: number; color_code?: string; image?: string }>>({});
  readonly selectedFoodSize = signal<{ name: string; price: number } | null>(null);
  readonly selectedFoodExtras = signal<{ name: string; price: number }[]>([]);
  readonly selectedFoodRemovals = signal<string[]>([]);
  readonly conflictMessage = signal<string | null>(null);
  private pendingBuyNow = false;
  specialInstructions = '';

  readonly effectiveUnitPrice = computed(() => {
    const p = this.product();
    if (!p) return 0;
    const baseSale = p.sale_price && Number(p.sale_price) > 0 && Number(p.sale_price) < Number(p.price)
      ? Number(p.sale_price)
      : Number(p.price || 0);
    const chosenSize = this.selectedFoodSize();
    const base = chosenSize && chosenSize.price > 0 ? chosenSize.price : baseSale;

    const extrasSum = this.selectedFoodExtras().reduce((sum, e) => sum + Number(e.price || 0), 0);
    const variantsSum = Object.values(this.selectedVariantOptions()).reduce(
      (sum, opt) => sum + Number(opt?.price_delta || 0),
      0
    );
    return base + extrasSum + variantsSum;
  });

  readonly effectiveTotalPrice = computed(() => this.effectiveUnitPrice() * this.quantitySignal());

  readonly isWishlisted = computed(() => {
    const p = this.product();
    return p ? this.cart.wishlistIds().has(p.id) : false;
  });

  readonly displayedRelated = computed(() => {
    const list = this.relatedProducts();
    return this.showAllRelated() ? list : list.slice(0, 4);
  });

  readonly quantitySignal = signal<number>(1);
  get quantity(): number {
    return this.quantitySignal();
  }
  set quantity(val: number) {
    this.quantitySignal.set(val);
  }
  newReview = { rating: 5, comment: '' };

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      if (id) {
        this.loadProductData(id);
      }
    });
  }

  private loadProductData(id: string | number): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.selectedImageIndex.set(0);
    this.quantity = 1;
    this.selectedVariantOptions.set({});
    this.selectedFoodSize.set(null);
    this.selectedFoodExtras.set([]);
    this.selectedFoodRemovals.set([]);
    this.specialInstructions = '';
    this.conflictMessage.set(null);

    this.storefront.getProductById(id).subscribe({
      next: (p) => {
        this.product.set(p);
        this.loading.set(false);
        this.loadSecondaryProducts(p);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message || 'تعذر تحميل بيانات المنتج، تأكد من تشغيل الخادم.');
      }
    });

    this.storefront.getProductReviews(id).subscribe({
      next: (r) => this.reviews.set(r || []),
      error: () => {}
    });
  }

  private loadSecondaryProducts(p: Product): void {
    if (p.category_id) {
      this.storefront.getProducts({ category: p.category_id, per_page: 9 }).subscribe({
        next: (res) => {
          const items: Product[] = res?.data || (Array.isArray(res) ? res : []);
          this.relatedProducts.set(items.filter((item) => item.id !== p.id));
        },
        error: () => {}
      });
    }

    const sellerFilter = p.seller_id || p.seller?.id;
    this.storefront.getProducts(sellerFilter ? { seller_id: sellerFilter, per_page: 5 } : { per_page: 5 }).subscribe({
      next: (res) => {
        const items: Product[] = res?.data || (Array.isArray(res) ? res : []);
        this.storeProducts.set(items.filter((item) => item.id !== p.id).slice(0, 4));
      },
      error: () => {}
    });
  }

  onImageMouseMove(event: MouseEvent): void {
    const target = event.currentTarget as HTMLElement | null;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.zoomOrigin.set(`${x}% ${y}%`);
  }

  onImageMouseLeave(): void {
    this.zoomOrigin.set('center center');
  }

  prevImage(): void {
    const len = this.allImages().length;
    if (len <= 1) return;
    this.selectedImageIndex.update((i) => (i - 1 + len) % len);
  }

  nextImage(): void {
    const len = this.allImages().length;
    if (len <= 1) return;
    this.selectedImageIndex.update((i) => (i + 1) % len);
  }

  shareProduct(): void {
    const p = this.product();
    if (!p) return;
    if (navigator.share) {
      navigator.share({ title: p.name, text: p.description, url: window.location.href }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      this.toast.success('تم نسخ رابط المنتج!');
    }
  }

  toggleWishlist(): void {
    const p = this.product();
    if (!p) return;
    if (!this.auth.isAuthenticated()) {
      this.toast.info('يرجى تسجيل الدخول لإضافة المنتج للمفضلة');
      return;
    }
    this.cart.toggleWishlist(p.id).subscribe({
      next: () => this.toast.success(this.isWishlisted() ? 'تمت الإضافة إلى المفضلة' : 'تمت الإزالة من المفضلة'),
      error: () => this.toast.error('تعذر تحديث المفضلة')
    });
  }

  jumpToReviews(): void {
    this.activeTab.set('reviews');
    document.getElementById('product-tabs-section')?.scrollIntoView({ behavior: 'smooth' });
  }

  selectVariantOption(variantName: string, opt: { label: string; price_delta: number; color_code?: string; image?: string }): void {
    this.selectedVariantOptions.update((curr) => ({ ...curr, [variantName]: opt }));
    if (opt.image) {
      const idx = this.allImages().indexOf(opt.image);
      if (idx >= 0) this.selectedImageIndex.set(idx);
    }
  }

  selectFoodSize(sz: { name: string; price: number }): void {
    this.selectedFoodSize.set(sz);
  }

  isExtraSelected(name: string): boolean {
    return this.selectedFoodExtras().some((e) => e.name === name);
  }

  toggleFoodExtra(ex: { name: string; price: number }): void {
    this.selectedFoodExtras.update((list) =>
      list.some((e) => e.name === ex.name) ? list.filter((e) => e.name !== ex.name) : [...list, ex]
    );
  }

  toggleFoodRemoval(rem: string): void {
    this.selectedFoodRemovals.update((list) =>
      list.includes(rem) ? list.filter((r) => r !== rem) : [...list, rem]
    );
  }

  changeQuantity(delta: number): void {
    const p = this.product();
    const next = this.quantity + delta;
    if (next < 1) return;
    if (delta > 0 && p?.stock && next > p.stock) {
      this.toast.info(`الكمية المطلوبة (${next}) تتجاوز المخزون المتوفر (${p.stock})`);
      return;
    }
    this.quantity = next;
  }

  private buildSelectedOptionsPayload(): any {
    const payload: Record<string, any> = {};
    const variants = this.selectedVariantOptions();
    for (const [k, v] of Object.entries(variants)) {
      payload[k] = v.label;
    }
    if (this.selectedFoodSize()) payload['size'] = this.selectedFoodSize();
    if (this.selectedFoodExtras().length > 0) payload['extras'] = this.selectedFoodExtras();
    if (this.selectedFoodRemovals().length > 0) payload['removals'] = this.selectedFoodRemovals();
    if (this.specialInstructions.trim()) payload['special_instructions'] = this.specialInstructions.trim();
    return Object.keys(payload).length > 0 ? payload : undefined;
  }

  addToCart(buyNow: boolean, forceClear = false): void {
    const p = this.product();
    if (!p) return;
    if (!this.auth.isAuthenticated()) {
      this.toast.info('يرجى تسجيل الدخول أولاً');
      return;
    }
    this.pendingBuyNow = buyNow;
    this.cart
      .addToCart({
        product_id: p.id,
        quantity: this.quantity,
        unit_price: this.effectiveUnitPrice(),
        selected_options: this.buildSelectedOptionsPayload(),
        force_clear: forceClear
      })
      .subscribe({
        next: () => {
          this.conflictMessage.set(null);
          this.toast.success('تمت الإضافة إلى السلة بنجاح');
          if (buyNow) {
            this.router.navigate(['/checkout']);
          }
        },
        error: (err) => {
          if (err.status === 409 && err.error?.conflict) {
            this.conflictMessage.set(err.error.message || 'السلة تحتوي على منتجات من متجر/مطعم آخر، هل تريد إفراغها وإضافة هذا المنتج؟');
          } else {
            this.toast.error(err.error?.message || 'حدث خطأ');
          }
        }
      });
  }

  confirmForceClearCart(): void {
    this.addToCart(this.pendingBuyNow, true);
  }

  submitReview(): void {
    const p = this.product();
    if (!p) return;
    this.submittingReview.set(true);
    this.storefront.addProductReview(p.id, this.newReview).subscribe({
      next: (rev) => {
        this.submittingReview.set(false);
        this.reviews.update((list) => [rev, ...list]);
        this.newReview = { rating: 5, comment: '' };
        this.toast.success('تم إضافة تقييمك بنجاح');
      },
      error: (err) => {
        this.submittingReview.set(false);
        this.toast.error(err.error?.message || 'تعذر إضافة التقييم');
      }
    });
  }
}
