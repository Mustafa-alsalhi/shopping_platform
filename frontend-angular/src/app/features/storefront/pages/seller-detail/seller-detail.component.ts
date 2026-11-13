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
  selector: 'app-seller-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  template: `
    @if (seller(); as s) {
      <div class="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div class="card overflow-hidden bg-gradient-to-r from-amber-700 to-orange-600 text-white relative">
          @if (s.cover_image) {
            <img [src]="s.cover_image" class="absolute inset-0 w-full h-full object-cover opacity-30" onerror="this.style.display='none'" />
          }
          <div class="relative z-10 p-6 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              @if (s.logo || s.avatar || s.avatar_image) {
                <img [src]="s.logo || s.avatar || s.avatar_image" [alt]="s.name || s.store_name"
                     class="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-lg bg-white shrink-0"
                     onerror="this.style.display='none'" />
              }
              <div>
                <div class="flex items-center gap-3">
                  <h1 class="text-2xl font-extrabold">{{ s.name || s.store_name }}</h1>
                  <span [class]="s.is_open ? 'bg-emerald-500' : 'bg-rose-600'" class="text-xs px-3 py-1 rounded-full font-bold">
                    {{ s.is_open ? 'مفتوح ويستقبل الطلبات' : 'مغلق حالياً' }}
                  </span>
                </div>
                <p class="text-sm text-amber-100 mt-2">{{ s.description }}</p>
                <div class="flex flex-wrap gap-4 text-xs mt-3 text-amber-100">
                  <span>⭐ التقييم: {{ s.rating || 0 }}</span>
                  <span>⏱️ التجهيز: {{ s.delivery_time || s.preparation_time || '25 دقيقة' }}</span>
                  <span>📍 العنوان: {{ s.address || s.city || 'صنعاء' }}</span>
                </div>
              </div>
            </div>
            <a [routerLink]="['/chat', s.id]" class="btn bg-white text-amber-800 font-bold text-xs">💬 مراسلة المتجر</a>
          </div>
        </div>

        @if (s.seller_categories && s.seller_categories.length > 0) {
          <div class="flex gap-2 overflow-x-auto pb-2">
            <button (click)="selectedCatId.set(null)" [class]="!selectedCatId() ? 'btn btn-primary text-xs' : 'btn btn-outline text-xs'">الكل</button>
            @for (sc of s.seller_categories; track sc.id) {
              <button (click)="selectedCatId.set(sc.id)" [class]="selectedCatId() === sc.id ? 'btn btn-primary text-xs' : 'btn btn-outline text-xs'">
                {{ sc.name }}
              </button>
            }
          </div>
        }

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          @for (prod of filteredProducts(); track prod.id) {
            <app-product-card [product]="prod"></app-product-card>
          }
        </div>
      </div>
    }
  `
})
export class SellerDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly storefront = inject(StorefrontService);

  readonly seller = signal<Seller | null>(null);
  readonly selectedCatId = signal<number | null>(null);

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params['id']) {
        this.storefront.getSellerById(params['id']).subscribe((s) => this.seller.set(s));
      }
    });
  }

  filteredProducts(): Product[] {
    const prods = this.seller()?.products || [];
    const catId = this.selectedCatId();
    if (!catId) return prods;
    return prods.filter((p) => p.seller_category_id === catId);
  }
}
