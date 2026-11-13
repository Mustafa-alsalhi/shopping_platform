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
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-extrabold text-gray-900 mb-6">جميع الأقسام والتصنيفات</h1>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
        @for (cat of categories(); track cat.id) {
          <a [routerLink]="['/products']" [queryParams]="{ category: cat.slug }" class="card p-6 text-center hover:shadow-xl transition">
            <div class="w-16 h-16 mx-auto mb-3 rounded-full bg-amber-100 overflow-hidden flex items-center justify-center text-amber-700 text-2xl font-extrabold border border-amber-200">
              @if (cat.image || cat.image_url) {
                <img [src]="cat.image || cat.image_url" [alt]="cat.name" class="w-full h-full object-cover" onerror="this.style.display='none'" />
              } @else {
                <span>{{ cat.name.slice(0, 1) }}</span>
              }
            </div>
            <h3 class="font-bold text-gray-900">{{ cat.name }}</h3>
            <p class="text-xs text-gray-500 mt-1">{{ cat.products_count || 0 }} منتج</p>
          </a>
        }
      </div>
    </div>
  `
})
export class CategoriesComponent implements OnInit {
  private readonly storefront = inject(StorefrontService);
  readonly categories = signal<Category[]>([]);
  ngOnInit(): void {
    this.storefront.getCategories('all').subscribe((res) => this.categories.set(res || []));
  }
}
