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
import { ORDER_STATUS_LABELS } from '../../../../shared/constants/order-status';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-extrabold text-gray-900 mb-6">📦 طلباتي</h1>
      @if (orders().length === 0) {
        <div class="card p-12 text-center text-gray-500">لا توجد طلبات حتى الآن.</div>
      }
      <div class="space-y-4">
        @for (o of orders(); track o.id) {
          <div class="card p-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p class="font-extrabold text-gray-900">#{{ o.order_number }}</p>
              <p class="text-xs text-gray-500">{{ o.created_at | date:'yyyy-MM-dd HH:mm' }}</p>
              <span class="badge bg-amber-100 text-amber-800 mt-2">{{ label(o.status) }}</span>
            </div>
            <div class="text-lg font-extrabold text-amber-700">{{ (o.total ?? o.total_amount) | number:'1.0-2' }} ر.ي</div>
            <a [routerLink]="['/orders', o.id, 'track']" class="btn btn-primary text-xs">تتبع الطلب</a>
          </div>
        }
      </div>
    </div>
  `
})
export class OrdersComponent implements OnInit {
  private readonly cart = inject(CartService);
  readonly orders = signal<Order[]>([]);

  ngOnInit(): void {
    this.cart.getOrders().subscribe({ next: (o) => this.orders.set(o || []) });
  }

  label(s: string) { return ORDER_STATUS_LABELS[s] || s; }
}
