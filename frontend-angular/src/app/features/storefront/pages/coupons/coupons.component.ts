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
  selector: 'app-coupons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-extrabold text-gray-900 mb-6">🎟️ كوبونات الخصم الفعالة</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        @for (c of coupons(); track c.id) {
          <div class="card p-6 border-2 border-dashed border-amber-400 flex items-center justify-between">
            <div>
              <h3 class="font-extrabold text-lg text-gray-900">{{ c.name }}</h3>
              <p class="text-xs text-gray-500">{{ c.description }}</p>
              <span class="text-xs text-amber-700 font-bold block mt-1">
                الخصم: {{ c.value }} {{ c.type === 'percentage' ? '%' : 'ر.ي' }}
              </span>
            </div>
            <button (click)="copyCode(c.code)" class="px-4 py-2 bg-amber-100 text-amber-900 font-mono font-extrabold rounded-lg hover:bg-amber-200">
              {{ c.code }} 📋
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class CouponsComponent implements OnInit {
  private readonly storefront = inject(StorefrontService);
  private readonly toast = inject(ToastService);
  readonly coupons = signal<Coupon[]>([]);

  ngOnInit(): void {
    this.storefront.getActiveCoupons().subscribe((res) => this.coupons.set(res?.data || []));
  }

  copyCode(code: string) {
    navigator.clipboard?.writeText(code);
    this.toast.success(`تم نسخ الكود: ${code}`);
  }
}
