import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-payment-method-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="font-extrabold">{{ editing ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع' }}</h3>
          <button type="button" (click)="close.emit()">✕</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-bold block mb-1">الاسم *</label><input class="input" [(ngModel)]="m.name" name="name" required /></div>
          <div><label class="text-xs font-bold block mb-1">الكود *</label><input class="input font-mono" [(ngModel)]="m.code" name="code" required placeholder="kuraimi / cod" /></div>
        </div>
        <div><label class="text-xs font-bold block mb-1">الوصف / تعليمات الدفع</label><textarea class="input" rows="3" [(ngModel)]="m.description" name="description"></textarea></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-bold block mb-1">الرسوم الإضافية</label><input type="number" step="0.01" class="input" [(ngModel)]="m.fee" name="fee" /></div>
          <div><label class="text-xs font-bold block mb-1">أيقونة نصية / إيموجي</label><input class="input" [(ngModel)]="m.icon" name="icon" placeholder="💳" /></div>
        </div>
        <div>
          <label class="text-xs font-bold block mb-1">صورة / شعار طريقة الدفع</label>
          <input type="file" accept="image/*" (change)="uploadIcon($event)" class="text-xs" />
          <input class="input mt-2 text-xs" [(ngModel)]="m.icon_image" name="icon_image" placeholder="أو رابط الأيقونة" />
          @if (m.icon_image) { <img [src]="img(m.icon_image)" class="h-14 mt-2 rounded border object-contain" /> }
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
export class AdminPaymentMethodModalComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  @Input() editing: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  m: any = {};
  img = resolveAdminImg;

  ngOnInit(): void {
    this.m = this.editing
      ? { ...this.editing }
      : { name: '', code: '', description: '', fee: 0, icon: '💳', icon_image: '', is_active: true };
  }

  uploadIcon(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.admin.uploadPaymentIcon(file).subscribe({
      next: (r) => { this.m.icon_image = r?.icon_url || r?.data?.icon_url; this.toast.success('تم رفع الأيقونة'); },
      error: () => this.toast.error('تعذر رفع الأيقونة')
    });
  }

  save() {
    const req = this.editing ? this.admin.updatePaymentMethod(this.editing.id, this.m) : this.admin.createPaymentMethod(this.m);
    req.subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.saved.emit(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }
}
