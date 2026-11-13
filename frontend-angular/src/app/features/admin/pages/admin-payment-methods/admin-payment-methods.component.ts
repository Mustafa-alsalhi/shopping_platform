import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-payment-methods',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-extrabold">طرق الدفع</h1>
          <p class="text-xs text-gray-500">إدارة بوابات الدفع والحوالات البنكية ورسومها</p>
        </div>
        <button (click)="openForm(null)" class="btn btn-primary text-sm">+ إضافة طريقة دفع</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (pm of methods(); track pm.id) {
          <div class="card p-4 space-y-3">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                @if (pm.icon_image) {
                  <img [src]="img(pm.icon_image)" class="w-11 h-11 rounded-xl object-contain border bg-white p-1" />
                } @else {
                  <div class="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-2xl">{{ pm.icon || '💳' }}</div>
                }
                <div>
                  <h3 class="font-extrabold">{{ pm.name }}</h3>
                  <p class="text-xs font-mono text-gray-500">{{ pm.code }} • رسوم: {{ pm.fee ?? 0 }}</p>
                </div>
              </div>
              <span class="badge" [class]="pm.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'">
                {{ pm.is_active ? 'مفعّل' : 'معطّل' }}
              </span>
            </div>
            <p class="text-xs text-gray-600 min-h-[32px]">{{ pm.description || 'بدون تعليمات' }}</p>
            <div class="flex justify-end gap-3 pt-2 border-t border-amber-50 text-xs">
              <button (click)="openForm(pm)" class="text-blue-700 font-bold">تعديل</button>
              <button (click)="remove(pm)" class="text-rose-600">حذف</button>
            </div>
          </div>
        } @empty {
          <div class="card p-10 text-center text-gray-500 md:col-span-3">لا توجد طرق دفع.</div>
        }
      </div>

      @if (showForm()) {
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="font-extrabold">{{ editing() ? 'تعديل طريقة الدفع' : 'إضافة طريقة دفع' }}</h3>
              <button type="button" (click)="showForm.set(false)">✕</button>
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
              <button type="button" (click)="showForm.set(false)" class="btn btn-outline">إلغاء</button>
            </div>
          </form>
        </div>
      }
    </div>
  `
})
export class AdminPaymentMethodsComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  readonly methods = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  m: any = {};
  img = resolveAdminImg;

  ngOnInit(): void { this.load(); }
  load() { this.admin.getPaymentMethods().subscribe({ next: (r) => this.methods.set(Array.isArray(r) ? r : r?.data || []) }); }

  openForm(row: any | null) {
    this.editing.set(row);
    this.m = row ? { ...row } : { name: '', code: '', description: '', fee: 0, icon: '💳', icon_image: '', is_active: true };
    this.showForm.set(true);
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
    const row = this.editing();
    const req = row ? this.admin.updatePaymentMethod(row.id, this.m) : this.admin.createPaymentMethod(this.m);
    req.subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.showForm.set(false); this.load(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }

  remove(pm: any) { if (confirm(`حذف "${pm.name}"؟`)) this.admin.deletePaymentMethod(pm.id).subscribe({ next: () => this.load() }); }
}
