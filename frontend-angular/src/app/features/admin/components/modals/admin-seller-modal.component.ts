import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-seller-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="font-extrabold">{{ editing ? 'تعديل بيانات البائع' : 'إضافة بائع جديد' }}</h3>
          <button type="button" (click)="close.emit()">✕</button>
        </div>
        @if (!editing) {
          <div>
            <label class="text-xs font-bold block mb-1">حساب المستخدم المالك *</label>
            <select class="input" [(ngModel)]="m.user_id" name="user_id" required>
              <option [ngValue]="null" disabled>اختر المستخدم</option>
              @for (u of users; track u.id) { <option [ngValue]="u.id">{{ u.name }} ({{ u.phone || u.email }})</option> }
            </select>
          </div>
        }
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-bold block mb-1">اسم المتجر / المطعم *</label><input class="input" [(ngModel)]="m.name" name="name" required /></div>
          <div>
            <label class="text-xs font-bold block mb-1">نوع النشاط</label>
            <select class="input" [(ngModel)]="m.type" name="type"><option value="store">متجر</option><option value="restaurant">مطعم</option></select>
          </div>
          <div><label class="text-xs font-bold block mb-1">البريد</label><input class="input" [(ngModel)]="m.email" name="email" /></div>
          <div><label class="text-xs font-bold block mb-1">الهاتف</label><input class="input" [(ngModel)]="m.phone" name="phone" /></div>
        </div>
        <div><label class="text-xs font-bold block mb-1">العنوان</label><input class="input" [(ngModel)]="m.address" name="address" /></div>
        <div><label class="text-xs font-bold block mb-1">الوصف</label><textarea class="input" rows="2" [(ngModel)]="m.description" name="description"></textarea></div>
        <div class="grid grid-cols-3 gap-3 items-center">
          <div>
            <label class="text-xs font-bold block mb-1">الحالة</label>
            <select class="input" [(ngModel)]="m.status" name="status">
              <option value="active">نشط</option><option value="pending">قيد المراجعة</option><option value="suspended">موقوف</option><option value="rejected">مرفوض</option>
            </select>
          </div>
          <label class="flex items-center gap-2 text-sm font-bold pt-4"><input type="checkbox" [(ngModel)]="m.verified" name="verified" /> موثق</label>
          <label class="flex items-center gap-2 text-sm font-bold pt-4"><input type="checkbox" [(ngModel)]="m.featured" name="featured" /> مميز</label>
        </div>
        <div class="flex gap-3 pt-2">
          <button class="btn btn-primary">حفظ</button>
          <button type="button" (click)="close.emit()" class="btn btn-outline">إلغاء</button>
        </div>
      </form>
    </div>
  `
})
export class AdminSellerModalComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  @Input() editing: any = null;
  @Input() users: any[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  m: any = {};

  ngOnInit(): void {
    const s = this.editing;
    this.m = s
      ? { name: s.name || s.store_name, description: s.description || '', email: s.email || '', phone: s.phone || '', address: s.address || '', type: s.type || 'store', status: s.status || 'active', verified: !!s.verified, featured: !!s.featured }
      : { user_id: null, name: '', description: '', email: '', phone: '', address: '', type: 'store', status: 'active', verified: false, featured: false };
  }

  save() {
    const s = this.editing;
    const req = s ? this.admin.updateSeller(s.id, this.m) : this.admin.createSeller(this.m);
    req.subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.saved.emit(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }
}
