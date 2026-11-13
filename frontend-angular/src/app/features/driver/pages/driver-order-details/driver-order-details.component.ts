import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DriverService } from '../../../../core/services/driver.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LocationPickerComponent } from '../../../../shared/components/location-picker.component';
import { DRIVER_STATUS_LABELS, ORDER_STATUS_LABELS } from '../../../../shared/constants/order-status';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const d = (x: number) => (x * Math.PI) / 180;
  const a = Math.sin(d(lat2 - lat1) / 2) ** 2 + Math.cos(d(lat1)) * Math.cos(d(lat2)) * Math.sin(d(lon2 - lon1) / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Component({
  selector: 'app-driver-order-details',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LocationPickerComponent],
  template: `
    @if (order(); as o) {
      <div class="space-y-5">
        <a routerLink="/driver/orders" class="text-sm text-amber-700 font-bold">← الطلبات</a>
        <div class="card p-5 space-y-2">
          <div class="flex items-center justify-between">
            <h1 class="text-lg font-extrabold">طلب #{{ o.order_number }}</h1>
            <span class="badge bg-blue-100 text-blue-800">{{ driverLabel(o.driver_status) }}</span>
          </div>
          <p class="text-sm">👤 {{ o.user?.name }} — 📞 <a [href]="'tel:' + o.user?.phone" class="text-amber-700 font-bold">{{ o.user?.phone }}</a></p>
          @if (distance() !== null) { <p class="text-sm">📏 المسافة بين المتجر والعميل: <strong>{{ distance() }} كم</strong></p> }
          <p class="text-sm">💰 المبلغ المطلوب تحصيله: <strong>{{ o.payment_method === 'cod' ? (o.total | number:'1.0-2') : 'مدفوع مسبقاً' }}</strong></p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          @if (storeLat()) {
            <div class="card p-4"><app-location-picker label="🏪 موقع المتجر (الاستلام)" [latitude]="storeLat()!" [longitude]="storeLng()!" [readonly]="true"></app-location-picker></div>
          }
          @if (o.latitude) {
            <div class="card p-4"><app-location-picker label="📍 موقع العميل (التسليم)" [latitude]="+o.latitude" [longitude]="+o.longitude!" [readonly]="true"></app-location-picker></div>
          }
        </div>

        <div class="card p-5 space-y-2">
          <h2 class="font-extrabold">المنتجات</h2>
          @for (it of o.items || []; track it.id) {
            <div class="flex justify-between text-sm"><span>{{ it.product?.name || it.product_name }} × {{ it.quantity }}</span><span>{{ it.product?.seller?.store_name }}</span></div>
          }
        </div>

        @if (o.driver_status !== 'delivered') {
          <div class="card p-5 space-y-3">
            <h2 class="font-extrabold">تحديث حالة التوصيل</h2>
            <div class="flex flex-wrap gap-2">
              @if (o.driver_status === 'assigned') { <button (click)="update('picked_up_from_seller')" class="btn btn-primary">تم استلام الطلب من المتجر</button> }
              @if (o.driver_status === 'picked_up_from_seller') { <button (click)="update('out_for_delivery')" class="btn btn-primary">في الطريق للعميل</button> }
              @if (o.driver_status === 'out_for_delivery') {
                <input class="input w-48" [(ngModel)]="code" placeholder="كود التسليم من العميل" />
                <button (click)="update('delivered')" class="btn btn-success">تأكيد التسليم</button>
              }
            </div>
          </div>
        }
      </div>
    }
  `
})
export class DriverOrderDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly driver = inject(DriverService);
  private readonly toast = inject(ToastService);

  readonly order = signal<any>(null);
  readonly storeLat = signal<number | null>(null);
  readonly storeLng = signal<number | null>(null);
  readonly distance = signal<number | null>(null);
  code = '';

  ngOnInit(): void { this.load(); }

  load() {
    this.driver.getOrderDetails(this.route.snapshot.params['id']).subscribe({
      next: (r) => {
        const o = r?.data;
        this.order.set(o);
        const seller = o?.items?.[0]?.product?.seller;
        if (seller?.latitude && seller?.longitude) {
          this.storeLat.set(+seller.latitude);
          this.storeLng.set(+seller.longitude);
          if (o.latitude && o.longitude) {
            this.distance.set(Math.round(haversineKm(+seller.latitude, +seller.longitude, +o.latitude, +o.longitude) * 10) / 10);
          }
        }
      }
    });
  }

  update(status: string) {
    const payload: any = { driver_status: status };
    if (status === 'delivered') payload.delivery_code = this.code;
    this.driver.updateOrderStatus(this.order().id, payload).subscribe({
      next: () => { this.toast.success('تم تحديث الحالة'); this.load(); },
      error: (err) => this.toast.error(err.error?.message || 'تعذر التحديث')
    });
  }
  driverLabel(s?: string) { return s ? (DRIVER_STATUS_LABELS[s] || s) : 'جديد'; }
}
