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
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LocationPickerComponent],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-extrabold text-gray-900 mb-6">إتمام الطلب</h1>

      @if (cart.items().length === 0) {
        <div class="card p-12 text-center">
          <p class="font-bold text-gray-600 mb-4">السلة فارغة</p>
          <a routerLink="/products" class="btn btn-primary">تصفح المنتجات</a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 space-y-6">
            <!-- Address -->
            <div class="card p-6 space-y-4">
              <h2 class="font-extrabold text-gray-900">عنوان التوصيل</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input class="input" [(ngModel)]="address.full_name" placeholder="الاسم الكامل" />
                <input class="input" [(ngModel)]="address.phone" placeholder="رقم الجوال" />
                <input class="input" [(ngModel)]="address.city" placeholder="المدينة" />
                <input class="input" [(ngModel)]="address.street" placeholder="الشارع / الحي" />
              </div>
              <textarea class="input" rows="2" [(ngModel)]="address.building_details" placeholder="تفاصيل المبنى / الدور / أقرب معلم"></textarea>
              <textarea class="input" rows="2" [(ngModel)]="notes" placeholder="ملاحظات للمندوب أو المتجر (اختياري)"></textarea>

              <app-location-picker
                label="حدد موقع التوصيل على الخريطة"
                [latitude]="lat" [longitude]="lng"
                (locationChange)="onLocation($event)">
              </app-location-picker>

              @if (distanceKm() !== null) {
                <div class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                  📏 المسافة من المتجر: <strong>{{ distanceKm() }} كم</strong> — 🚚 رسوم التوصيل: <strong>{{ shipping() | number:'1.0-2' }} ر.ي</strong>
                </div>
              }
            </div>

            <!-- Payment -->
            <div class="card p-6 space-y-4">
              <h2 class="font-extrabold text-gray-900">طريقة الدفع</h2>
              <label class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer" [class.border-amber-500]="paymentMethod === 'cod'">
                <input type="radio" name="pm" value="cod" [(ngModel)]="paymentMethod" />
                <span class="font-semibold">💵 الدفع عند الاستلام</span>
              </label>
              @for (m of paymentMethods(); track m.id) {
                <label class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer" [class.border-amber-500]="paymentMethod === m.code">
                  <input type="radio" name="pm" [value]="m.code" [(ngModel)]="paymentMethod" />
                  <span class="font-semibold">💳 {{ m.name }}</span>
                  @if (m.fee > 0) { <span class="text-xs text-gray-500">(رسوم {{ m.fee }})</span> }
                </label>
              }

              @if (paymentMethod !== 'cod') {
                <div class="p-4 bg-amber-50/60 rounded-xl space-y-3">
                  <p class="text-xs text-gray-600">{{ selectedMethod()?.description }}</p>
                  <input class="input" [(ngModel)]="proof.payer_name" placeholder="اسم المرسل" />
                  <input class="input" [(ngModel)]="proof.phone_number" placeholder="رقم جوال المرسل" />
                  <input class="input" [(ngModel)]="proof.reference_number" placeholder="رقم الحوالة / المرجع" />
                  <input type="file" accept="image/*" (change)="onProofFile($event)" class="text-xs" />
                  <textarea class="input" rows="2" [(ngModel)]="proof.payment_notes" placeholder="ملاحظات الدفع"></textarea>
                </div>
              }
            </div>
          </div>

          <!-- Summary -->
          <div class="card p-6 h-fit space-y-4">
            <h2 class="font-extrabold text-gray-900">ملخص الطلب</h2>
            @for (it of cart.items(); track it.id) {
              <div class="flex justify-between text-sm">
                <span>{{ it.product?.name }} × {{ it.quantity }}</span>
                <span class="font-bold">{{ ((it.unit_price ?? it.price ?? it.product?.price ?? 0) * it.quantity) | number:'1.0-2' }}</span>
              </div>
            }
            <hr />
            <div class="flex gap-2">
              <input class="input" [(ngModel)]="couponCode" placeholder="كود الخصم" />
              <button type="button" (click)="applyCoupon()" class="btn btn-outline text-xs">تطبيق</button>
            </div>
            <div class="space-y-1 text-sm">
              <div class="flex justify-between"><span>المجموع الفرعي</span><span>{{ cart.total() | number:'1.0-2' }}</span></div>
              <div class="flex justify-between"><span>رسوم التوصيل</span><span>{{ shipping() | number:'1.0-2' }}</span></div>
              @if (discount() > 0) {
                <div class="flex justify-between text-emerald-700"><span>الخصم</span><span>- {{ discount() | number:'1.0-2' }}</span></div>
              }
              <div class="flex justify-between font-extrabold text-lg pt-2 border-t">
                <span>الإجمالي</span><span class="text-amber-700">{{ grandTotal() | number:'1.0-2' }} ر.ي</span>
              </div>
            </div>
            <button type="button" (click)="placeOrder()" [disabled]="submitting()" class="btn btn-primary w-full py-3 font-bold">
              {{ submitting() ? 'جاري إنشاء الطلب...' : 'تأكيد الطلب' }}
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class CheckoutComponent implements OnInit {
  readonly cart = inject(CartService);
  private readonly storefront = inject(StorefrontService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly paymentMethods = signal<any[]>([]);
  readonly shipping = signal(0);
  readonly distanceKm = signal<number | null>(null);
  readonly discount = signal(0);
  readonly submitting = signal(false);

  lat = 15.3694;
  lng = 44.191;
  paymentMethod = 'cod';
  notes = '';
  couponCode = '';
  proofFile: File | null = null;

  address = { full_name: '', phone: '', city: 'صنعاء', street: '', building_details: '' };
  proof = { payer_name: '', phone_number: '', reference_number: '', payment_notes: '' };

  ngOnInit(): void {
    this.cart.loadCart().subscribe({ error: () => {} });
    this.storefront.getActivePaymentMethods().subscribe({ next: (m) => this.paymentMethods.set(m || []) });
    const u = this.auth.currentUser();
    if (u) {
      this.address.full_name = u.name || '';
      this.address.phone = u.phone || '';
      this.address.city = u.city || 'صنعاء';
    }
    this.onLocation({ lat: this.lat, lng: this.lng });
  }

  selectedMethod() {
    return this.paymentMethods().find((m) => m.code === this.paymentMethod);
  }

  grandTotal(): number {
    const fee = this.paymentMethod !== 'cod' ? Number(this.selectedMethod()?.fee || 0) : 0;
    return Math.max(0, this.cart.total() + this.shipping() + fee - this.discount());
  }

  onLocation(c: { lat: number; lng: number }) {
    this.lat = c.lat;
    this.lng = c.lng;
    this.cart.calculateDelivery(c.lat, c.lng).subscribe({
      next: (res) => {
        this.shipping.set(Number(res?.data?.delivery_fee || 0));
        this.distanceKm.set(res?.data?.distance_km ?? null);
      },
      error: () => {}
    });
  }

  onProofFile(e: Event) {
    this.proofFile = (e.target as HTMLInputElement).files?.[0] || null;
  }

  applyCoupon() {
    if (!this.couponCode.trim()) return;
    this.storefront.validateCoupon(this.couponCode.trim(), this.cart.total()).subscribe({
      next: (res) => {
        this.discount.set(Number(res?.data?.discount_amount || 0));
        this.toast.success('تم تطبيق كود الخصم');
      },
      error: (err) => {
        this.discount.set(0);
        this.toast.error(err.error?.message || 'كود الخصم غير صالح');
      }
    });
  }

  placeOrder() {
    if (!this.address.full_name || !this.address.phone || !this.address.street) {
      this.toast.error('يرجى إكمال بيانات عنوان التوصيل');
      return;
    }
    if (this.paymentMethod !== 'cod' && (!this.proof.payer_name || !this.proof.reference_number)) {
      this.toast.error('يرجى إدخال بيانات الدفع (اسم المرسل ورقم المرجع)');
      return;
    }

    this.submitting.set(true);
    const payload = {
      shipping_address: this.address,
      payment_method: this.paymentMethod,
      shipping: this.shipping(),
      discount: this.discount(),
      latitude: this.lat,
      longitude: this.lng,
      delivery_notes: this.address.building_details,
      notes: this.notes
    };

    this.cart.createOrder(payload).subscribe({
      next: (order: any) => {
        if (this.paymentMethod !== 'cod') {
          const fd = new FormData();
          fd.append('order_id', String(order.id));
          fd.append('payment_method', this.paymentMethod);
          fd.append('payment_method_name', this.selectedMethod()?.name || this.paymentMethod);
          fd.append('payer_name', this.proof.payer_name);
          fd.append('reference_number', this.proof.reference_number);
          fd.append('phone_number', this.proof.phone_number || this.address.phone);
          fd.append('payment_notes', this.proof.payment_notes);
          fd.append('payment_amount', String(this.grandTotal()));
          fd.append('payment_fee', String(this.selectedMethod()?.fee || 0));
          if (this.proofFile) fd.append('payment_image', this.proofFile);
          this.storefront.submitPaymentRequest(fd).subscribe({ error: () => this.toast.error('تعذر إرسال إثبات الدفع') });
        }
        this.submitting.set(false);
        this.toast.success('تم إنشاء طلبك بنجاح');
        this.router.navigate(['/orders', order.id, 'track']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.toast.error(err.error?.message || 'تعذر إنشاء الطلب');
      }
    });
  }
}
