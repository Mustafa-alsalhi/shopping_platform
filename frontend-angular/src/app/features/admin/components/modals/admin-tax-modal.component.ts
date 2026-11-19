import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-tax-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="font-extrabold">{{ editing ? 'تعديل الضريبة' : 'إضافة ضريبة' }}</h3>
          <button type="button" (click)="close.emit()">✕</button>
        </div>
        <div><label class="text-xs font-bold block mb-1">الاسم *</label><input class="input" [(ngModel)]="m.name" name="name" required /></div>
        <div><label class="text-xs font-bold block mb-1">الوصف</label><input class="input" [(ngModel)]="m.description" name="description" /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-bold block mb-1">القيمة *</label><input type="number" step="0.01" class="input" [(ngModel)]="m.rate" name="rate" required /></div>
          <div>
            <label class="text-xs font-bold block mb-1">النوع</label>
            <select class="input" [(ngModel)]="m.type" name="type"><option value="percentage">نسبة %</option><option value="fixed">ثابتة</option></select>
          </div>
        </div>
        <div class="flex gap-6 text-sm font-bold">
          <label class="flex items-center gap-2"><input type="checkbox" [(ngModel)]="m.is_default" name="is_default" /> افتراضية</label>
          <label class="flex items-center gap-2"><input type="checkbox" [(ngModel)]="m.is_active" name="is_active" /> مفعّلة</label>
        </div>
        <div class="flex gap-3 pt-2">
          <button class="btn btn-primary">حفظ</button>
          <button type="button" (click)="close.emit()" class="btn btn-outline">إلغاء</button>
        </div>
      </form>
    </div>
  `
})
export class AdminTaxModalComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  @Input() editing: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  m: any = {};

  ngOnInit(): void {
    this.m = this.editing
      ? { ...this.editing }
      : { name: '', description: '', rate: 15, type: 'percentage', is_default: false, is_active: true };
  }

  save() {
    const row = this.editing;
    const req = row ? this.admin.updateTax(row.id, this.m) : this.admin.createTax(this.m);
    req.subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.saved.emit(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }
}
