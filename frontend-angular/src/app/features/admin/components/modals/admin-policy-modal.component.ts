import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';

export const POLICY_LABELS: Record<string, string> = {
  return_policy: 'سياسة الإرجاع',
  exchange_policy: 'سياسة الاستبدال',
  cancellation_policy: 'سياسة الإلغاء',
  shipping_policy: 'سياسة الشحن والتوصيل',
  privacy_policy: 'سياسة الخصوصية',
  terms_of_service: 'شروط الخدمة والاستخدام',
  cookies_policy: 'سياسة ملفات الارتباط'
};

@Component({
  selector: 'app-admin-policy-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="font-extrabold">{{ editing ? 'تعديل السياسة' : 'إضافة سياسة جديدة' }}</h3>
          <button type="button" (click)="close.emit()">✕</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-bold block mb-1">نوع السياسة *</label>
            <select class="input" [(ngModel)]="m.type" name="type">
              @for (k of policyKeys; track k) { <option [value]="k">{{ typeLabel(k) }}</option> }
            </select>
          </div>
          <div><label class="text-xs font-bold block mb-1">العنوان *</label><input class="input" [(ngModel)]="m.title" name="title" required /></div>
        </div>
        <div><label class="text-xs font-bold block mb-1">وصف مختصر</label><input class="input" [(ngModel)]="m.description" name="description" /></div>
        <div><label class="text-xs font-bold block mb-1">المحتوى الكامل *</label><textarea class="input" rows="7" [(ngModel)]="m.content" name="content" required></textarea></div>
        <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="m.is_active" name="is_active" /> مفعّلة</label>
        <div class="flex gap-3 pt-2">
          <button class="btn btn-primary">حفظ</button>
          <button type="button" (click)="close.emit()" class="btn btn-outline">إلغاء</button>
        </div>
      </form>
    </div>
  `
})
export class AdminPolicyModalComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  @Input() editing: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  policyKeys = Object.keys(POLICY_LABELS);
  m: any = {};

  ngOnInit(): void {
    this.m = this.editing
      ? { ...this.editing }
      : { type: 'terms_of_service', title: '', description: '', content: '', is_active: true };
  }

  typeLabel(t: string) { return POLICY_LABELS[t] || t; }

  save() {
    this.admin.savePolicy(this.m).subscribe({
      next: () => { this.toast.success('تم حفظ السياسة'); this.saved.emit(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }
}
