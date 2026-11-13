import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Product } from '../../core/models/models';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="card group relative flex flex-col h-full hover:shadow-xl transition-all duration-300">
      <!-- Discount / Featured Badges -->
      <div class="absolute top-3 right-3 z-10 flex flex-col gap-1">
        @if (discountPercent() > 0) {
          <span class="bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
            خصم {{ discountPercent() }}%
          </span>
        }
        @if (product.featured || product.is_featured) {
          <span class="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
            مميز
          </span>
        }
      </div>

      <!-- Wishlist Button -->
      <button
        type="button"
        (click)="onToggleWishlist($event)"
        class="absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center transition">
        <span [class]="isInWishlist() ? 'text-rose-600 text-lg' : 'text-gray-400 text-lg'">♥</span>
      </button>

      <!-- Image -->
      <a [routerLink]="['/products', product.id]" class="block relative overflow-hidden aspect-square bg-amber-50">
        <img
          [src]="product.image || product.image_url || 'https://placehold.co/400x400/fef3c7/b45309?text=Asalah'"
          [alt]="product.name"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onerror="this.src='https://placehold.co/400x400/fef3c7/b45309?text=Asalah'" />
      </a>

      <!-- Content -->
      <div class="p-4 flex flex-col flex-1 justify-between">
        <div>
          @if (product.seller) {
            <a [routerLink]="['/seller', product.seller.id]" class="text-xs text-amber-700 font-semibold hover:underline block mb-1">
              {{ product.seller.name || product.seller.store_name }}
            </a>
          }
          <a [routerLink]="['/products', product.id]" class="font-bold text-gray-900 hover:text-amber-600 line-clamp-2 mb-1">
            {{ product.name }}
          </a>
          <p class="text-xs text-gray-500 line-clamp-2 mb-2">{{ product.description }}</p>
        </div>

        <div>
          <!-- Rating -->
          <div class="flex items-center gap-1 text-xs text-amber-500 mb-2">
            <span>★</span>
            <span class="font-bold text-gray-800">{{ product.rating || 0 }}</span>
            <span class="text-gray-400">({{ product.reviews_count || 0 }})</span>
          </div>

          <!-- Price & Add to Cart -->
          <div class="flex items-center justify-between pt-2 border-t border-amber-100">
            <div>
              <span class="text-lg font-extrabold text-amber-700">{{ product.price | number:'1.0-2' }} ر.ي</span>
              @if ((product.old_price || product.compare_at_price) && (product.old_price || product.compare_at_price)! > product.price) {
                <span class="block text-xs text-gray-400 line-through">
                  {{ (product.old_price || product.compare_at_price) | number:'1.0-2' }} ر.ي
                </span>
              }
            </div>

            <button
              type="button"
              [disabled]="loading() || product.stock <= 0"
              (click)="onAddToCart()"
              class="btn btn-primary text-xs px-3 py-2 disabled:opacity-50">
              @if (product.stock <= 0) {
                نفدت الكمية
              } @else if (loading()) {
                ...
              } @else {
                + للسلة
              }
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Restaurant Conflict Modal -->
    @if (conflictMessage()) {
      <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
          <h3 class="text-lg font-bold text-gray-900">تنبيه تعارض السلة</h3>
          <p class="text-sm text-gray-600">{{ conflictMessage() }}</p>
          <div class="flex items-center justify-end gap-3">
            <button type="button" (click)="conflictMessage.set(null)" class="btn btn-outline">إلغاء</button>
            <button type="button" (click)="confirmForceClearAndAdd()" class="btn btn-primary">إفراغ السلة والإضافة</button>
          </div>
        </div>
      </div>
    }
  `
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;

  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly loading = signal(false);
  readonly conflictMessage = signal<string | null>(null);

  discountPercent(): number {
    const oldP = this.product.old_price || this.product.compare_at_price || 0;
    if (oldP > this.product.price && oldP > 0) {
      return Math.round(((oldP - this.product.price) / oldP) * 100);
    }
    return 0;
  }

  isInWishlist(): boolean {
    return this.cartService.wishlistIds().has(this.product.id);
  }

  onToggleWishlist(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    if (!this.authService.isAuthenticated()) {
      this.toast.info('يرجى تسجيل الدخول لإضافة المنتج للمفضلة');
      return;
    }
    this.cartService.toggleWishlist(this.product.id).subscribe({
      next: () => this.toast.success('تم تحديث قائمة المفضلة')
    });
  }

  onAddToCart(forceClear = false) {
    if (!this.authService.isAuthenticated()) {
      this.toast.info('يرجى تسجيل الدخول لإضافة المنتجات إلى السلة');
      return;
    }
    this.loading.set(true);
    this.cartService
      .addToCart({
        product_id: this.product.id,
        quantity: 1,
        unit_price: this.product.price,
        force_clear: forceClear
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.conflictMessage.set(null);
          this.toast.success(`تمت إضافة "${this.product.name}" إلى السلة`);
        },
        error: (err) => {
          this.loading.set(false);
          if (err.status === 409 && err.error?.conflict) {
            this.conflictMessage.set(err.error.message);
          } else {
            this.toast.error(err.error?.message || 'حدث خطأ أثناء الإضافة للسلة');
          }
        }
      });
  }

  confirmForceClearAndAdd() {
    this.onAddToCart(true);
  }
}

