import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

const POLICY_LABELS: Record<string, string> = {
  return_policy: 'سياسة الإرجاع',
  exchange_policy: 'سياسة الاستبدال',
  cancellation_policy: 'سياسة الإلغاء',
  shipping_policy: 'سياسة الشحن والتوصيل',
  privacy_policy: 'سياسة الخصوصية',
  terms_of_service: 'شروط الخدمة والاستخدام',
  cookies_policy: 'سياسة ملفات الارتباط'
};

@Component({
  selector: 'app-admin-policies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-extrabold">السياسات والشروط</h1>
          <p class="text-xs text-gray-500">إدارة سياسات الخصوصية، الشروط، الإرجاع، والشحن</p>
        </div>
        <button (click)="openForm(null)" class="btn btn-primary text-sm">+ إضافة سياسة</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (p of policies(); track p.id) {
          <div class="card p-4 space-y-2">
            <div class="flex items-start justify-between">
              <div>
                <span class="badge bg-amber-100 text-amber-800 text-xs">{{ typeLabel(p.type) }}</span>
                <h3 class="font-extrabold mt-1">{{ p.title }}</h3>
              </div>
              <span class="badge" [class]="p.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'">
                {{ p.is_active ? 'مفعّلة' : 'معطّلة' }}
              </span>
            </div>
            <p class="text-xs text-gray-500 line-clamp-2">{{ p.description || p.content }}</p>
            <div class="flex justify-end gap-3 pt-2 border-t border-amber-50 text-xs">
              <button (click)="openForm(p)" class="text-blue-700 font-bold">تعديل</button>
              <button (click)="remove(p)" class="text-rose-600">حذف</button>
            </div>
          </div>
        } @empty {
          <div class="card p-10 text-center text-gray-500 md:col-span-2">لا توجد سياسات مضافة.</div>
        }
      </div>

      @if (showForm()) {
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="font-extrabold">{{ editing() ? 'تعديل السياسة' : 'إضافة سياسة جديدة' }}</h3>
              <button type="button" (click)="showForm.set(false)">✕</button>
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
              <button type="button" (click)="showForm.set(false)" class="btn btn-outline">إلغاء</button>
            </div>
          </form>
        </div>
      }
    </div>
  `
})
export class AdminPoliciesComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly policies = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  policyKeys = Object.keys(POLICY_LABELS);
  m: any = {};

  ngOnInit(): void { this.load(); }
  typeLabel(t: string) { return POLICY_LABELS[t] || t; }
  load() { this.admin.getPolicies().subscribe({ next: (r) => this.policies.set(Array.isArray(r) ? r : r?.data || []) }); }

  openForm(row: any | null) {
    this.editing.set(row);
    this.m = row ? { ...row } : { type: 'terms_of_service', title: '', description: '', content: '', is_active: true };
    this.showForm.set(true);
  }

  save() {
    this.admin.savePolicy(this.m).subscribe({
      next: () => { this.toast.success('تم حفظ السياسة'); this.showForm.set(false); this.load(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }

  remove(p: any) { if (confirm(`حذف "${p.title}"؟`)) this.admin.deletePolicy(p.id).subscribe({ next: () => this.load() }); }
}
