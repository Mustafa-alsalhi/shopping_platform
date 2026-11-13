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
  selector: 'app-offers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-extrabold text-gray-900 mb-6">🔥 العروض والتخفيضات الحصرية</h1>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        @for (o of offers(); track o.id) {
          <div class="card overflow-hidden flex flex-col justify-between">
            @if (o.image || o.banner || o.thumbnail) {
              <div class="h-44 bg-amber-100 relative overflow-hidden">
                <img [src]="o.image || o.banner || o.thumbnail" [alt]="o.title" class="w-full h-full object-cover" onerror="this.style.display='none'" />
              </div>
            }
            <div class="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <span class="badge bg-rose-100 text-rose-800 font-bold mb-2">خصم {{ o.discount_percentage || o.discount_value }}%</span>
                <h3 class="text-lg font-extrabold text-gray-900">{{ o.title }}</h3>
                <p class="text-sm text-gray-600 mt-1">{{ o.description }}</p>
              </div>
              <a [routerLink]="['/offers', o.id]" class="btn btn-primary w-full text-xs">تصفح منتجات العرض</a>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class OffersComponent implements OnInit {
  private readonly storefront = inject(StorefrontService);
  readonly offers = signal<Offer[]>([]);
  ngOnInit(): void {
    this.storefront.getOffers().subscribe((res) => this.offers.set(res || []));
  }
}
