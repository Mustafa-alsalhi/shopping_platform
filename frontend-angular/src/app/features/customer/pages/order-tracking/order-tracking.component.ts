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
import { ORDER_STATUS_LABELS, DRIVER_STATUS_LABELS } from '../../../../shared/constants/order-status';

@Component({
  selector: 'app-order-tracking',
  standalone: true,
  imports: [CommonModule, RouterLink, LocationPickerComponent],
  template: `
    @if (order(); as o) {
      <div class="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div class="card p-6 space-y-3">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-extrabold">تتبع الطلب #{{ o.order_number }}</h1>
            <span class="badge bg-amber-100 text-amber-800">{{ label(o.status) }}</span>
          </div>

          <!-- Progress steps -->
          <div class="flex items-center justify-between pt-4">
            @for (s of steps; track s.key; let i = $index) {
              <div class="flex-1 text-center">
                <div class="w-9 h-9 mx-auto rounded-full flex items-center justify-center text-sm font-bold"
                     [class]="stepIndex() >= i ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'">{{ i + 1 }}</div>
                <p class="text-[11px] mt-1 text-gray-600">{{ s.label }}</p>
              </div>
            }
          </div>

          @if (o.driver_status) {
            <p class="text-sm text-blue-700 font-semibold">🛵 {{ driverLabel(o.driver_status) }}@if (o.driver) { — {{ o.driver.name }} ({{ o.driver.phone }}) }</p>
          }
          @if (o.delivery_code && o.status !== 'delivered') {
            <div class="p-3 bg-amber-50 border border-amber-300 rounded-lg text-sm">
              🔐 كود التسليم (أعطه للمندوب عند الاستلام فقط): <strong class="text-xl tracking-widest">{{ o.delivery_code }}</strong>
            </div>
          }
        </div>

        @if (o.latitude && o.longitude) {
          <div class="card p-6">
            <app-location-picker label="موقع التوصيل" [latitude]="+o.latitude" [longitude]="+o.longitude" [readonly]="true"></app-location-picker>
          </div>
        }

        <div class="card p-6 space-y-2">
          <h2 class="font-extrabold mb-2">محتويات الطلب</h2>
          @for (it of o.items || []; track it.id) {
            <div class="flex justify-between text-sm border-b border-amber-50 py-2">
              <span>{{ it.product?.name || it.product_name }} × {{ it.quantity }}</span>
              <span class="font-bold">{{ it.total | number:'1.0-2' }}</span>
            </div>
          }
          <div class="flex justify-between text-sm pt-2"><span>التوصيل</span><span>{{ o.shipping | number:'1.0-2' }}</span></div>
          <div class="flex justify-between text-sm"><span>الضريبة</span><span>{{ o.tax | number:'1.0-2' }}</span></div>
          <div class="flex justify-between font-extrabold text-lg"><span>الإجمالي</span><span class="text-amber-700">{{ (o.total ?? o.total_amount) | number:'1.0-2' }} ر.ي</span></div>
        </div>
        <a routerLink="/orders" class="text-sm text-amber-700 font-bold">← العودة إلى طلباتي</a>
      </div>
    }
  `
})
export class OrderTrackingComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cart = inject(CartService);
  readonly order = signal<Order | null>(null);

  steps = [
    { key: 'pending', label: 'تم الاستلام' },
    { key: 'processing', label: 'قيد التجهيز' },
    { key: 'shipped', label: 'في الطريق' },
    { key: 'delivered', label: 'تم التسليم' }
  ];

  ngOnInit(): void {
    this.route.params.subscribe((p) => {
      this.cart.getOrderById(p['id']).subscribe({ next: (o) => this.order.set(o) });
    });
  }

  stepIndex(): number {
    const s = this.order()?.status;
    return this.steps.findIndex((x) => x.key === s);
  }
  label(s: string) { return ORDER_STATUS_LABELS[s] || s; }
  driverLabel(s: string) { return DRIVER_STATUS_LABELS[s] || s; }
}
