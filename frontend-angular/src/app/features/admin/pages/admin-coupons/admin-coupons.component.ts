import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';
import { AdminCouponModalComponent } from '../../components/modals/admin-coupon-modal.component';

@Component({
  selector: 'app-admin-coupons',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminCouponModalComponent],
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
        <app-admin-coupon-modal [editing]="editing()" (close)="showForm.set(false)" (saved)="showForm.set(false); load()" />
      }
    </div>
  `
})
export class AdminCouponsComponent implements OnInit {
  private readonly admin = inject(AdminService);

  readonly coupons = signal<any[]>([]);
  readonly stats = signal<any>(null);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);

  ngOnInit(): void { this.load(); }

  load() {
    this.admin.getCoupons().subscribe({ next: (r) => this.coupons.set(Array.isArray(r) ? r : r?.data || []) });
    this.admin.getCouponStats().subscribe({ next: (r) => this.stats.set(r?.data || r) });
  }

  openForm(row: any | null) {
    this.editing.set(row);
    this.showForm.set(true);
  }

  toggle(c: any) { this.admin.toggleCoupon(c.id).subscribe({ next: () => this.load() }); }
  remove(c: any) { if (confirm(`حذف الكوبون "${c.code}"؟`)) this.admin.deleteCoupon(c.id).subscribe({ next: () => this.load() }); }
}
