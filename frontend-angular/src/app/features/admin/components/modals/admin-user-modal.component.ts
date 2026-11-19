import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="font-extrabold">{{ editing ? 'تعديل المستخدم' : 'إضافة مستخدم جديد' }}</h3>
          <button type="button" (click)="close.emit()">✕</button>
        </div>
        <div><label class="text-xs font-bold block mb-1">الاسم *</label><input class="input" [(ngModel)]="m.name" name="name" required /></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-bold block mb-1">البريد الإلكتروني *</label><input type="email" class="input" [(ngModel)]="m.email" name="email" required /></div>
          <div><label class="text-xs font-bold block mb-1">الجوال</label><input class="input" [(ngModel)]="m.phone" name="phone" /></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-bold block mb-1">كلمة المرور {{ editing ? '(اختياري للتغيير)' : '*' }}</label>
            <input type="password" class="input" [(ngModel)]="m.password" name="password" [required]="!editing" />
          </div>
          <div>
            <label class="text-xs font-bold block mb-1">الدور</label>
            <select class="input" [(ngModel)]="m.role" name="role">
              <option value="customer">عميل</option><option value="seller">بائع</option><option value="driver">مندوب</option><option value="admin">مدير</option>
            </select>
          </div>
        </div>
        <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="m.is_active" name="is_active" /> الحساب نشط</label>
        <div class="flex gap-3 pt-2">
          <button class="btn btn-primary">حفظ</button>
          <button type="button" (click)="close.emit()" class="btn btn-outline">إلغاء</button>
        </div>
      </form>
    </div>
  `
})
export class AdminUserModalComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  @Input() editing: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  m: any = {};

  ngOnInit(): void {
    const u = this.editing;
    this.m = u
      ? { name: u.name, email: u.email, phone: u.phone || '', password: '', role: u.role || 'customer', is_active: !!u.is_active }
      : { name: '', email: '', phone: '', password: '', role: 'customer', is_active: true };
  }

  save() {
    const u = this.editing;
    const payload = { ...this.m };
    if (u && !payload.password) delete payload.password;
    const req = u ? this.admin.updateUser(u.id, payload) : this.admin.createUser(payload);
    req.subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.saved.emit(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }
}
