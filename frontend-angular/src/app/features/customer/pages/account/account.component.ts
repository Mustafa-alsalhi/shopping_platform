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
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div class="card p-6 space-y-4">
        <h1 class="text-xl font-extrabold">👤 حسابي</h1>
        <form (ngSubmit)="save()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label class="text-xs font-bold">الاسم</label><input class="input" [(ngModel)]="form.name" name="name" /></div>
          <div><label class="text-xs font-bold">البريد الإلكتروني</label><input class="input" [(ngModel)]="form.email" name="email" /></div>
          <div><label class="text-xs font-bold">رقم الجوال</label><input class="input" [(ngModel)]="form.phone" name="phone" /></div>
          <div><label class="text-xs font-bold">المدينة</label><input class="input" [(ngModel)]="form.city" name="city" /></div>
          <div class="md:col-span-2"><label class="text-xs font-bold">العنوان</label><input class="input" [(ngModel)]="form.address" name="address" /></div>
          <div><label class="text-xs font-bold">كلمة مرور جديدة (اختياري)</label><input type="password" class="input" [(ngModel)]="form.password" name="password" /></div>
          <div><label class="text-xs font-bold">تأكيد كلمة المرور</label><input type="password" class="input" [(ngModel)]="form.password_confirmation" name="pc" /></div>
          <div class="md:col-span-2"><button type="submit" class="btn btn-primary">حفظ التغييرات</button></div>
        </form>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm font-bold">
        <a routerLink="/orders" class="card p-4 hover:shadow-lg">📦 طلباتي</a>
        <a routerLink="/wishlist" class="card p-4 hover:shadow-lg">♥ المفضلة</a>
        <a routerLink="/coupons" class="card p-4 hover:shadow-lg">🎟️ الكوبونات</a>
        <button (click)="auth.logout()" class="card p-4 text-rose-600 hover:shadow-lg">تسجيل الخروج</button>
      </div>
    </div>
  `
})
export class AccountComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  form: any = { name: '', email: '', phone: '', city: '', address: '', password: '', password_confirmation: '' };

  ngOnInit(): void {
    const u = this.auth.currentUser();
    if (u) this.form = { ...this.form, name: u.name, email: u.email || '', phone: u.phone || '', city: u.city || '', address: u.address || '' };
  }

  save() {
    const payload: any = { ...this.form };
    if (!payload.password) { delete payload.password; delete payload.password_confirmation; }
    this.auth.updateProfile(payload).subscribe({
      next: () => this.toast.success('تم تحديث الحساب بنجاح'),
      error: (err) => this.toast.error(err.error?.message || 'تعذر تحديث الحساب')
    });
  }
}
