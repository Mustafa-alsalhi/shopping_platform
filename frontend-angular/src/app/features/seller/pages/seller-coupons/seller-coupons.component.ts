import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerService } from '../../../../core/services/seller.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SellerCouponModalComponent } from '../../components/modals/seller-coupon-modal.component';

@Component({
  selector: 'app-seller-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, SellerCouponModalComponent],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-extrabold">كوبونات المتجر</h1>
          <p class="text-xs text-gray-500">إنشاء أكواد خصم خاصة بعملاء متجرك</p>
        </div>
        <button (click)="openForm(null)" class="btn btn-primary text-sm">+ إضافة كوبون</button>
      </div>

      <div class="card overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-amber-50 text-xs">
            <tr><th class="p-3">الكود</th><th class="p-3">الاسم</th><th class="p-3">الخصم</th><th class="p-3">الحد الأدنى</th><th class="p-3">الاستخدام</th><th class="p-3">الحالة</th><th class="p-3">إجراءات</th></tr>
          </thead>
          <tbody>
            @for (c of coupons(); track c.id) {
              <tr class="border-t border-amber-100 text-center">
                <td class="p-3 font-mono font-extrabold text-amber-800">{{ c.code }}</td>
                <td class="font-bold">{{ c.name }}</td>
                <td>{{ c.value }} {{ c.type === 'percentage' ? '%' : 'ر.س' }}</td>
                <td>{{ c.min_order_amount ?? 0 }}</td>
                <td>{{ c.used_count ?? 0 }} / {{ c.max_uses || '∞' }}</td>
                <td>
                  <button (click)="toggle(c)" class="badge cursor-pointer" [class]="c.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'">
                    {{ c.is_active ? 'مفعّل' : 'معطّل' }}
                  </button>
                </td>
                <td class="space-x-2 space-x-reverse">
                  <button (click)="openForm(c)" class="text-blue-700 font-bold text-xs">تعديل</button>
                  <button (click)="remove(c)" class="text-rose-600 text-xs">حذف</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="p-8 text-center text-gray-500">لا توجد كوبونات.</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (showForm()) {
        <app-seller-coupon-modal
          [isEditing]="!!editing()"
          [model]="m"
          (generateCode)="genCode()"
          (saved)="save()"
          (closed)="showForm.set(false)" />
      }
    </div>
  `
})
export class SellerCouponsComponent implements OnInit {
  private readonly seller = inject(SellerService);
  private readonly toast = inject(ToastService);
  readonly coupons = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  m: any = {};

  ngOnInit(): void { this.load(); }
  load() { this.seller.getCoupons().subscribe({ next: (r) => this.coupons.set(r?.data || r || []) }); }
  genCode() { this.m.code = 'SHOP' + Math.random().toString(36).substring(2, 6).toUpperCase(); }

  openForm(c: any | null) {
    this.editing.set(c);
    this.m = c ? { ...c, expires_at: c.expires_at ? String(c.expires_at).slice(0, 10) : '' } : { code: '', name: '', type: 'percentage', value: 10, min_order_amount: 0, max_uses: null, expires_at: '', is_active: true };
    this.showForm.set(true);
  }

  save() {
    const c = this.editing();
    const payload = { ...this.m, code: (this.m.code || '').toUpperCase() };
    const req = c ? this.seller.updateCoupon(c.id, payload) : this.seller.createCoupon(payload);
    req.subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.showForm.set(false); this.load(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }

  toggle(c: any) { this.seller.toggleCoupon(c.id).subscribe({ next: () => this.load() }); }
  remove(c: any) { if (confirm('حذف الكوبون؟')) this.seller.deleteCoupon(c.id).subscribe({ next: () => this.load() }); }
}
