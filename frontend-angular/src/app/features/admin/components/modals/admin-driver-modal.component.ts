import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-driver-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="font-extrabold">{{ editing ? 'تعديل المندوب' : 'إضافة مندوب جديد' }}</h3>
          <button type="button" (click)="close.emit()">✕</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-bold block mb-1">الاسم *</label><input class="input" [(ngModel)]="m.name" name="name" required /></div>
          <div><label class="text-xs font-bold block mb-1">الجوال *</label><input class="input" [(ngModel)]="m.phone" name="phone" required /></div>
          <div><label class="text-xs font-bold block mb-1">البريد الإلكتروني</label><input type="email" class="input" [(ngModel)]="m.email" name="email" /></div>
          <div><label class="text-xs font-bold block mb-1">كلمة المرور {{ editing ? '(اختياري)' : '*' }}</label><input type="password" class="input" [(ngModel)]="m.password" name="password" [required]="!editing" /></div>
          <div><label class="text-xs font-bold block mb-1">منطقة العمل</label><input class="input" [(ngModel)]="m.work_zone" name="work_zone" /></div>
          <div>
            <label class="text-xs font-bold block mb-1">نوع المركبة</label>
            <select class="input" [(ngModel)]="m.vehicle_type" name="vehicle_type"><option value="motorcycle">دراجة نارية</option><option value="car">سيارة</option><option value="van">فان</option></select>
          </div>
          <div><label class="text-xs font-bold block mb-1">رقم اللوحة</label><input class="input" [(ngModel)]="m.vehicle_number" name="vehicle_number" /></div>
          <div><label class="text-xs font-bold block mb-1">رقم الرخصة</label><input class="input" [(ngModel)]="m.license_number" name="license_number" /></div>
        </div>
        <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="m.is_active" name="is_active" /> نشط</label>
        <div class="flex gap-3 pt-2">
          <button class="btn btn-primary">حفظ</button>
          <button type="button" (click)="close.emit()" class="btn btn-outline">إلغاء</button>
        </div>
      </form>
    </div>
  `
})
export class AdminDriverModalComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  @Input() editing: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  m: any = {};

  ngOnInit(): void {
    const d = this.editing;
    this.m = d
      ? { name: d.name, phone: d.phone || '', email: d.email || '', password: '', work_zone: d.work_zone || '', vehicle_type: d.driver?.vehicle_type || d.vehicle_type || 'motorcycle', vehicle_number: d.driver?.vehicle_number || d.vehicle_number || '', license_number: d.driver?.license_number || '', is_active: d.is_active ?? true }
      : { name: '', phone: '', email: '', password: '', work_zone: '', vehicle_type: 'motorcycle', vehicle_number: '', license_number: '', is_active: true };
  }

  save() {
    const d = this.editing;
    const payload = { ...this.m };
    if (d && !payload.password) delete payload.password;
    const req = d ? this.admin.updateDriver(d.id, payload) : this.admin.createDriver(payload);
    req.subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.saved.emit(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }
}

