import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-shipping-company-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="font-extrabold">{{ editing ? 'تعديل شركة الشحن' : 'إضافة شركة شحن' }}</h3>
          <button type="button" (click)="close.emit()">✕</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-bold block mb-1">اسم الشركة *</label><input class="input" [(ngModel)]="m.name" name="name" required /></div>
          <div><label class="text-xs font-bold block mb-1">الكود *</label><input class="input font-mono" [(ngModel)]="m.code" name="code" required /></div>
          <div><label class="text-xs font-bold block mb-1">التكلفة</label><input type="number" step="0.01" class="input" [(ngModel)]="m.cost" name="cost" /></div>
          <div><label class="text-xs font-bold block mb-1">أيام التوصيل</label><input type="number" class="input" [(ngModel)]="m.delivery_days" name="delivery_days" /></div>
        </div>
        <div><label class="text-xs font-bold block mb-1">رابط التتبع</label><input class="input" [(ngModel)]="m.tracking_url" name="tracking_url" placeholder="https://..." /></div>
        <div><label class="text-xs font-bold block mb-1">الوصف</label><textarea class="input" rows="2" [(ngModel)]="m.description" name="description"></textarea></div>
        <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="m.is_active" name="is_active" /> مفعّل</label>
        <div class="flex gap-3 pt-2">
          <button class="btn btn-primary">حفظ</button>
          <button type="button" (click)="close.emit()" class="btn btn-outline">إلغاء</button>
        </div>
      </form>
    </div>
  `
})
export class AdminShippingCompanyModalComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  @Input() editing: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  m: any = {};

  ngOnInit(): void {
    this.m = this.editing
      ? { ...this.editing }
      : { name: '', code: '', description: '', cost: 0, delivery_days: 2, tracking_url: '', is_active: true };
  }

  save() {
    const row = this.editing;
    const req = row ? this.admin.updateShippingCompany(row.id, this.m) : this.admin.createShippingCompany(this.m);
    req.subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.saved.emit(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }
}
