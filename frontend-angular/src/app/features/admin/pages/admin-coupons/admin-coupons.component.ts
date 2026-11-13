import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-extrabold">كوبونات الخصم</h1>
          <p class="text-xs text-gray-500">إنشاء وإدارة أكواد الخصم وحدود الاستخدام</p>
        </div>
        <button (click)="openForm(null)" class="btn btn-primary text-sm">+ إضافة كوبون</button>
      </div>

      @if (stats(); as s) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="card p-3.5"><p class="text-xs text-gray-500">الإجمالي</p><p class="text-xl font-extrabold">{{ s.total_coupons ?? coupons().length }}</p></div>
          <div class="card p-3.5"><p class="text-xs text-gray-500">النشطة</p><p class="text-xl font-extrabold text-emerald-700">{{ s.active_coupons ?? 0 }}</p></div>
          <div class="card p-3.5"><p class="text-xs text-gray-500">المنتهية</p><p class="text-xl font-extrabold text-rose-600">{{ s.expired_coupons ?? 0 }}</p></div>
          <div class="card p-3.5"><p class="text-xs text-gray-500">مرات الاستخدام</p><p class="text-xl font-extrabold text-amber-700">{{ s.total_uses ?? 0 }}</p></div>
        </div>
      }

      <div class="card overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-amber-50 text-xs">
            <tr><th class="p-3">الكود</th><th class="p-3">الاسم</th><th class="p-3">الخصم</th><th class="p-3">الحد الأدنى</th><th class="p-3">الاستخدام</th><th class="p-3">الانتهاء</th><th class="p-3">الحالة</th><th class="p-3">إجراءات</th></tr>
          </thead>
          <tbody>
            @for (c of coupons(); track c.id) {
              <tr class="border-t border-amber-100 text-center">
                <td class="p-3 font-mono font-extrabold text-amber-800">{{ c.code }}</td>
                <td class="font-bold">{{ c.name }}</td>
                <td>{{ c.value }} {{ c.type === 'percentage' ? '%' : 'ر.س' }}</td>
                <td>{{ c.min_order_amount ?? 0 }}</td>
                <td>{{ c.used_count ?? 0 }} / {{ c.max_uses || '∞' }}</td>
                <td class="text-xs">{{ c.expires_at ? (c.expires_at | date:'yyyy-MM-dd') : 'دائم' }}</td>
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
              <tr><td colspan="8" class="p-8 text-center text-gray-500">لا توجد كوبونات.</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (showForm()) {
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="font-extrabold">{{ editing() ? 'تعديل الكوبون' : 'إضافة كوبون خصم' }}</h3>
              <button type="button" (click)="showForm.set(false)">✕</button>
            </div>
            <div>
              <label class="text-xs font-bold block mb-1">كود الخصم *</label>
              <div class="flex gap-2">
                <input class="input font-mono uppercase" [(ngModel)]="m.code" name="code" required />
                <button type="button" (click)="genCode()" class="btn btn-outline text-xs shrink-0">توليد كود</button>
              </div>
            </div>
            <div><label class="text-xs font-bold block mb-1">اسم الكوبون *</label><input class="input" [(ngModel)]="m.name" name="name" required /></div>
            <div><label class="text-xs font-bold block mb-1">الوصف</label><textarea class="input" rows="2" [(ngModel)]="m.description" name="description"></textarea></div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-bold block mb-1">نوع الخصم</label>
                <select class="input" [(ngModel)]="m.type" name="type"><option value="percentage">نسبة مئوية %</option><option value="fixed">مبلغ ثابت</option></select>
              </div>
              <div><label class="text-xs font-bold block mb-1">القيمة *</label><input type="number" step="0.01" class="input" [(ngModel)]="m.value" name="value" required /></div>
              <div><label class="text-xs font-bold block mb-1">الحد الأدنى للطلب</label><input type="number" step="0.01" class="input" [(ngModel)]="m.min_order_amount" name="min_order_amount" /></div>
              <div><label class="text-xs font-bold block mb-1">أقصى خصم</label><input type="number" step="0.01" class="input" [(ngModel)]="m.max_discount" name="max_discount" /></div>
              <div><label class="text-xs font-bold block mb-1">أقصى عدد استخدام</label><input type="number" class="input" [(ngModel)]="m.max_uses" name="max_uses" /></div>
              <div><label class="text-xs font-bold block mb-1">لكل مستخدم</label><input type="number" class="input" [(ngModel)]="m.max_uses_per_user" name="max_uses_per_user" /></div>
              <div><label class="text-xs font-bold block mb-1">يبدأ في</label><input type="date" class="input" [(ngModel)]="m.starts_at" name="starts_at" /></div>
              <div><label class="text-xs font-bold block mb-1">ينتهي في</label><input type="date" class="input" [(ngModel)]="m.expires_at" name="expires_at" /></div>
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
export class AdminCouponsComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly coupons = signal<any[]>([]);
  readonly stats = signal<any>(null);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  m: any = {};

  ngOnInit(): void { this.load(); }

  load() {
    this.admin.getCoupons().subscribe({ next: (r) => this.coupons.set(Array.isArray(r) ? r : r?.data || []) });
    this.admin.getCouponStats().subscribe({ next: (r) => this.stats.set(r?.data || r) });
  }

  genCode() {
    this.m.code = 'SAVE' + Math.random().toString(36).substring(2, 7).toUpperCase();
  }

  openForm(row: any | null) {
    this.editing.set(row);
    this.m = row
      ? {
          ...row,
          starts_at: row.starts_at ? String(row.starts_at).slice(0, 10) : '',
          expires_at: row.expires_at ? String(row.expires_at).slice(0, 10) : ''
        }
      : { code: '', name: '', description: '', type: 'percentage', value: 10, min_order_amount: 0, max_discount: null, max_uses: null, max_uses_per_user: 1, starts_at: '', expires_at: '', is_active: true };
    this.showForm.set(true);
  }

  save() {
    const row = this.editing();
    const payload = { ...this.m, code: (this.m.code || '').toUpperCase() };
    const req = row ? this.admin.updateCoupon(row.id, payload) : this.admin.createCoupon(payload);
    req.subscribe({
      next: () => { this.toast.success('تم حفظ الكوبون'); this.showForm.set(false); this.load(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }

  toggle(c: any) { this.admin.toggleCoupon(c.id).subscribe({ next: () => this.load() }); }
  remove(c: any) { if (confirm(`حذف الكوبون "${c.code}"؟`)) this.admin.deleteCoupon(c.id).subscribe({ next: () => this.load() }); }
}
