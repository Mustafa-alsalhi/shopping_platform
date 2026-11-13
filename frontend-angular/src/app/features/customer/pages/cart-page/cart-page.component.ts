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
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-extrabold text-gray-900 mb-6">🛒 سلة التسوق</h1>
      @if (loading()) {
        <div class="card p-12 text-center text-gray-500">جاري التحميل...</div>
      } @else if (cart.items().length === 0) {
        <div class="card p-12 text-center space-y-4">
          <p class="text-5xl">🛒</p>
          <p class="font-bold text-gray-700">سلتك فارغة</p>
          <a routerLink="/products" class="btn btn-primary">تصفح المنتجات</a>
        </div>
      } @else {
        <div class="space-y-3">
          @for (item of cart.items(); track item.id) {
            <div class="card p-4 flex items-center gap-4">
              <img [src]="item.product?.image || item.product?.image_url || ''" class="w-20 h-20 rounded-xl object-cover bg-amber-50"
                   onerror="this.src='https://placehold.co/100x100/fef3c7/b45309?text=+'" />
              <div class="flex-1">
                <a [routerLink]="['/products', item.product_id]" class="font-bold text-gray-900 hover:text-amber-700">{{ item.product?.name }}</a>
                @if (item.product?.seller) {
                  <p class="text-xs text-gray-500">{{ item.product?.seller?.name || item.product?.seller?.store_name }}</p>
                }
                <p class="text-amber-700 font-bold text-sm mt-1">{{ unit(item) | number:'1.0-2' }} ر.ي</p>
              </div>
              <div class="flex items-center border border-amber-300 rounded-lg overflow-hidden">
                <button (click)="cart.updateQuantity(item.id, item.quantity - 1).subscribe()" [disabled]="item.quantity <= 1" class="px-3 py-1.5 bg-amber-50 font-bold">-</button>
                <span class="px-3 font-bold">{{ item.quantity }}</span>
                <button (click)="cart.updateQuantity(item.id, item.quantity + 1).subscribe()" class="px-3 py-1.5 bg-amber-50 font-bold">+</button>
              </div>
              <div class="w-24 text-left font-extrabold">{{ unit(item) * item.quantity | number:'1.0-2' }}</div>
              <button (click)="cart.removeItem(item.id).subscribe()" class="text-rose-600 text-sm">حذف</button>
            </div>
          }
        </div>
        <div class="card p-6 mt-6 flex flex-wrap items-center justify-between gap-4">
          <div class="text-lg font-extrabold">الإجمالي: <span class="text-amber-700">{{ cart.total() | number:'1.0-2' }} ر.ي</span></div>
          <div class="flex gap-3">
            <button (click)="cart.clearCart().subscribe()" class="btn btn-outline">إفراغ السلة</button>
            <a routerLink="/checkout" class="btn btn-primary">إتمام الطلب</a>
          </div>
        </div>
      }
    </div>
  `
})
export class CartPageComponent implements OnInit {
  readonly cart = inject(CartService);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.cart.loadCart().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
  }

  unit(i: any): number {
    return i.unit_price ?? i.price ?? i.product?.price ?? 0;
  }
}
