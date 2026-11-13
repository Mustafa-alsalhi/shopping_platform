import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { AuthService } from '../../../../core/services/auth.service';
import { StorefrontService } from '../../../../core/services/storefront.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Offer, Order, Product } from '../../../../core/models/models';
import { LocationPickerComponent } from '../../../../shared/components/location-picker.component';
import { ProductCardComponent } from '../../../../shared/components/product-card.component';

@Component({
  selector: 'app-shipping-info',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-10">
      <div class="card p-8 space-y-4">
        <h1 class="text-2xl font-extrabold">🚚 معلومات الشحن والتوصيل</h1>
        <p class="text-sm text-gray-700 leading-relaxed">
          يتم احتساب رسوم التوصيل تلقائياً بحسب المسافة بين موقع المتجر وموقع التسليم. يقوم مندوب التوصيل باستلام الطلب من المتجر
          وتسليمه لك، ويُطلب منك كود التسليم لتأكيد الاستلام.
        </p>
        @for (c of companies(); track c.id) {
          <div class="p-3 border border-amber-200 rounded-xl text-sm flex justify-between">
            <span class="font-bold">{{ c.name }}</span><span>{{ c.cost | number:'1.0-2' }} ر.ي — {{ c.delivery_days }} يوم</span>
          </div>
        }
      </div>
    </div>
  `
})
export class ShippingInfoComponent implements OnInit {
  private readonly storefront = inject(StorefrontService);
  readonly companies = signal<any[]>([]);
  ngOnInit(): void {
    this.storefront.getActiveShippingCompanies().subscribe({ next: (c) => this.companies.set(c || []), error: () => {} });
  }
}
