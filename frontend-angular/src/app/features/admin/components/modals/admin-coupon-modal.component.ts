import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-coupon-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="font-extrabold">{{ editing ? 'تعديل الكوبون' : 'إضافة كوبون خصم' }}</h3>
          <button type="button" (click)="close.emit()">✕</button>
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
          <button type="button" (click)="close.emit()" class="btn btn-outline">إلغاء</button>
        </div>
      </form>
    </div>
  `
})
export class AdminCouponModalComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  @Input() editing: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  m: any = {};

  ngOnInit(): void {
    this.m = this.editing
      ? {
          ...this.editing,
          starts_at: this.editing.starts_at ? String(this.editing.starts_at).slice(0, 10) : '',
          expires_at: this.editing.expires_at ? String(this.editing.expires_at).slice(0, 10) : ''
        }
      : { code: '', name: '', description: '', type: 'percentage', value: 10, min_order_amount: 0, max_discount: null, max_uses: null, max_uses_per_user: 1, starts_at: '', expires_at: '', is_active: true };
  }

  genCode() {
    this.m.code = 'SAVE' + Math.random().toString(36).substring(2, 7).toUpperCase();
  }

  save() {
    const payload = { ...this.m, code: (this.m.code || '').toUpperCase() };
    const req = this.editing ? this.admin.updateCoupon(this.editing.id, payload) : this.admin.createCoupon(payload);
    req.subscribe({
      next: () => { this.toast.success('تم حفظ الكوبون'); this.saved.emit(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }
}

