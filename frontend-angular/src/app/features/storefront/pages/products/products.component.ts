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
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex flex-col md:flex-row gap-6">
        <!-- Filters Sidebar -->
        <aside class="w-full md:w-64 shrink-0 card p-4 h-fit space-y-4">
          <h3 class="font-extrabold text-gray-900 border-b pb-2">تصفية النتائج</h3>

          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">البحث</label>
            <input type="text" [(ngModel)]="filters.search" (ngModelChange)="loadProducts()" class="input" placeholder="اسم المنتج..." />
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">القسم</label>
            <select [(ngModel)]="filters.category" (ngModelChange)="loadProducts()" class="input">
              <option value="">جميع الأقسام</option>
              @for (c of categories(); track c.id) {
                <option [value]="c.slug">{{ c.name }}</option>
              }
            </select>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">السعر من</label>
              <input type="number" [(ngModel)]="filters.min_price" (ngModelChange)="loadProducts()" class="input" />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-700 mb-1">السعر إلى</label>
              <input type="number" [(ngModel)]="filters.max_price" (ngModelChange)="loadProducts()" class="input" />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-gray-700 mb-1">الترتيب حسب</label>
            <select [(ngModel)]="filters.sort_by" (ngModelChange)="loadProducts()" class="input">
              <option value="created_at">الأحدث</option>
              <option value="price">السعر</option>
              <option value="rating">التقييم</option>
              <option value="name">الاسم</option>
            </select>
          </div>

          <button type="button" (click)="resetFilters()" class="btn btn-outline w-full text-xs">إعادة تعيين الفلاتر</button>
        </aside>

        <!-- Products Grid -->
        <div class="flex-1">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-xl font-extrabold text-gray-900">قائمة المنتجات ({{ total() }})</h1>
          </div>

          @if (products().length === 0) {
            <div class="card p-12 text-center text-gray-500">
              لا توجد منتجات مطابقة لخيارات البحث الحالية.
            </div>
          } @else {
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              @for (prod of products(); track prod.id) {
                <app-product-card [product]="prod"></app-product-card>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ProductsComponent implements OnInit {
  private readonly storefront = inject(StorefrontService);
  private readonly route = inject(ActivatedRoute);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly total = signal(0);

  filters: any = {
    search: '',
    category: '',
    type: '',
    min_price: '',
    max_price: '',
    sort_by: 'created_at',
    sort_order: 'desc',
    page: 1,
    per_page: 12
  };

  ngOnInit(): void {
    this.storefront.getCategories().subscribe({
      next: (cats) => this.categories.set(cats || [])
    });
    this.route.queryParams.subscribe((params) => {
      this.filters.search = params['search'] || '';
      this.filters.category = params['category'] || '';
      this.filters.type = params['type'] || '';
      this.loadProducts();
    });
  }

  loadProducts() {
    this.storefront.getProducts(this.filters).subscribe({
      next: (res) => {
        this.products.set(res?.data || []);
        this.total.set(res?.total || 0);
      }
    });
  }

  resetFilters() {
    this.filters = { search: '', category: '', type: '', min_price: '', max_price: '', sort_by: 'created_at', sort_order: 'desc', page: 1, per_page: 12 };
    this.loadProducts();
  }
}
