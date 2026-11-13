import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { StorefrontService } from '../../../../core/services/storefront.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LocationPickerComponent } from '../../../../shared/components/location-picker.component';

@Component({
  selector: 'app-become-seller',
  standalone: true,
  imports: [CommonModule, FormsModule, LocationPickerComponent],
  template: `
    <div class="max-w-3xl mx-auto my-10 p-6 card">
      <h1 class="text-2xl font-extrabold text-gray-900 mb-2">سجل كشريك تجاري (متجر / مطعم)</h1>
      <p class="text-sm text-gray-600 mb-6">انضم إلى منصة أصالة واعرض منتجاتك أو وجباتك لآلاف العملاء مع خدمة التوصيل الذكي.</p>

      <form (ngSubmit)="onSubmit()" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold mb-1">اسم المالك / المسؤول</label>
            <input type="text" [(ngModel)]="form.name" name="name" required class="input" />
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">رقم الجوال (واتساب)</label>
            <input type="text" [(ngModel)]="form.phone" name="phone" required class="input" placeholder="77xxxxxxx" />
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">البريد الإلكتروني</label>
            <input type="email" [(ngModel)]="form.email" name="email" required class="input" />
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">كلمة المرور</label>
            <input type="password" [(ngModel)]="form.password" name="password" required class="input" />
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">اسم المتجر أو المطعم</label>
            <input type="text" [(ngModel)]="form.store_name" name="store_name" required class="input" />
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">نوع النشاط</label>
            <select [(ngModel)]="form.type" name="type" class="input">
              <option value="store">متجر تسوق</option>
              <option value="restaurant">مطعم / كافيه</option>
              @for (act of storefront.activeActivities(); track act.id) {
                <option [value]="act.slug">{{ act.name }}</option>
              }
            </select>
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold mb-1">وصف المتجر / المطعم</label>
          <textarea [(ngModel)]="form.description" name="description" rows="3" class="input"></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold mb-1">المدينة</label>
            <input type="text" [(ngModel)]="form.city" name="city" required class="input" placeholder="صنعاء" />
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">العنوان التفصيلي</label>
            <input type="text" [(ngModel)]="form.address" name="address" required class="input" />
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">اسم صاحب حساب الكريمي</label>
            <input type="text" [(ngModel)]="form.kuraimi_account_name" name="kuraimi_account_name" class="input" />
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">رقم حساب الكريمي</label>
            <input type="text" [(ngModel)]="form.kuraimi_account_number" name="kuraimi_account_number" class="input" />
          </div>
        </div>

        <app-location-picker
          label="حدد موقع المتجر أو المطعم على الخريطة (لحساب مسافة التوصيل)"
          [latitude]="form.latitude"
          [longitude]="form.longitude"
          (locationChange)="onLocationPicked($event)">
        </app-location-picker>

        <button type="submit" [disabled]="loading()" class="btn btn-primary w-full py-3 font-bold">
          {{ loading() ? 'جاري إرسال الطلب...' : 'إرسال طلب الانضمام كشريك' }}
        </button>
      </form>
    </div>
  `
})
export class BecomeSellerComponent implements OnInit {
  private readonly auth = inject(AuthService);
  readonly storefront = inject(StorefrontService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly loading = signal(false);

  form = {
    name: '',
    phone: '',
    email: '',
    password: '',
    store_name: '',
    type: 'store',
    description: '',
    city: 'صنعاء',
    address: '',
    kuraimi_account_name: '',
    kuraimi_account_number: '',
    latitude: 15.3694,
    longitude: 44.1910
  };

  ngOnInit(): void {
    this.storefront.getActivities().subscribe({ error: () => {} });
  }

  onLocationPicked(coords: { lat: number; lng: number }) {
    this.form.latitude = coords.lat;
    this.form.longitude = coords.lng;
  }

  onSubmit() {
    this.loading.set(true);
    const fd = new FormData();
    Object.entries(this.form).forEach(([k, v]) => fd.append(k, String(v)));

    this.auth.registerSeller(fd).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toast.success(res?.message || 'تم تسجيل طلب المتجر بنجاح');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'حدث خطأ أثناء تسجيل المتجر');
      }
    });
  }
}
