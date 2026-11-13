import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerService } from '../../../../core/services/seller.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-seller-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="font-extrabold">{{ editing() ? 'تعديل الكوبون' : 'إضافة كوبون جديد' }}</h3>
              <button type="button" (click)="showForm.set(false)">✕</button>
            </div>
            <div>
              <label class="text-xs font-bold block mb-1">الكود *</label>
              <div class="flex gap-2">
                <input class="input font-mono uppercase" [(ngModel)]="m.code" name="code" required />
                <button type="button" (click)="genCode()" class="btn btn-outline text-xs shrink-0">توليد</button>
              </div>
            </div>
            <div><label class="text-xs font-bold block mb-1">الاسم *</label><input class="input" [(ngModel)]="m.name" name="name" required /></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-xs font-bold block mb-1">النوع</label><select class="input" [(ngModel)]="m.type" name="type"><option value="percentage">نسبة %</option><option value="fixed">ثابت</option></select></div>
              <div><label class="text-xs font-bold block mb-1">القيمة *</label><input type="number" step="0.01" class="input" [(ngModel)]="m.value" name="value" required /></div>
              <div><label class="text-xs font-bold block mb-1">حد أدنى للطلب</label><input type="number" class="input" [(ngModel)]="m.min_order_amount" name="min" /></div>
              <div><label class="text-xs font-bold block mb-1">أقصى استخدام</label><input type="number" class="input" [(ngModel)]="m.max_uses" name="max" /></div>
              <div><label class="text-xs font-bold block mb-1">ينتهي في</label><input type="date" class="input" [(ngModel)]="m.expires_at" name="exp" /></div>
            </div>
            <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="m.is_active" name="is_active" /> مفعّل</label>
            <div class="flex gap-3 pt-2">
              <button class="btn btn-primary">حفظ</button>
              <button type="button" (click)="showForm.set(false)" class="btn btn-outline">إلغاء</button>
            </div>
          </form>
        </div>
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
