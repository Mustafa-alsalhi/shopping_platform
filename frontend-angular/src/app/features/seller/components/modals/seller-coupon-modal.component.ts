import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-seller-coupon-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl">
      <form (ngSubmit)="saved.emit()" class="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="font-extrabold">{{ isEditing() ? 'تعديل الكوبون' : 'إضافة كوبون جديد' }}</h3>
          <button type="button" (click)="closed.emit()">✕</button>
        </div>
        <div>
          <label class="text-xs font-bold block mb-1">الكود *</label>
          <div class="flex gap-2">
            <input class="input font-mono uppercase" [(ngModel)]="model().code" name="code" required />
            <button type="button" (click)="generateCode.emit()" class="btn btn-outline text-xs shrink-0">توليد</button>
          </div>
        </div>
        <div><label class="text-xs font-bold block mb-1">الاسم *</label><input class="input" [(ngModel)]="model().name" name="name" required /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-bold block mb-1">النوع</label><select class="input" [(ngModel)]="model().type" name="type"><option value="percentage">نسبة %</option><option value="fixed">ثابت</option></select></div>
          <div><label class="text-xs font-bold block mb-1">القيمة *</label><input type="number" step="0.01" class="input" [(ngModel)]="model().value" name="value" required /></div>
          <div><label class="text-xs font-bold block mb-1">حد أدنى للطلب</label><input type="number" class="input" [(ngModel)]="model().min_order_amount" name="min" /></div>
          <div><label class="text-xs font-bold block mb-1">أقصى استخدام</label><input type="number" class="input" [(ngModel)]="model().max_uses" name="max" /></div>
          <div><label class="text-xs font-bold block mb-1">ينتهي في</label><input type="date" class="input" [(ngModel)]="model().expires_at" name="exp" /></div>
        </div>
        <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="model().is_active" name="is_active" /> مفعّل</label>
        <div class="flex gap-3 pt-2">
          <button class="btn btn-primary">حفظ</button>
          <button type="button" (click)="closed.emit()" class="btn btn-outline">إلغاء</button>
        </div>
      </form>
    </div>
  `
})
export class SellerCouponModalComponent {
  readonly isEditing = input<boolean>(false);
  readonly model = input.required<any>();
  readonly generateCode = output<void>();
  readonly saved = output<void>();
  readonly closed = output<void>();
}
