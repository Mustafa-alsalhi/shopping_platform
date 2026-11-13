import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-shipping-companies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-extrabold">شركات الشحن</h1>
          <p class="text-xs text-gray-500">إدارة شركات التوصيل والشحن وتكاليفها</p>
        </div>
        <button (click)="openForm(null)" class="btn btn-primary text-sm">+ إضافة شركة شحن</button>
      </div>

      <div class="card overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-amber-50 text-xs">
            <tr><th class="p-3">الشركة</th><th class="p-3">الكود</th><th class="p-3">التكلفة</th><th class="p-3">مدة التوصيل (أيام)</th><th class="p-3">الحالة</th><th class="p-3">إجراءات</th></tr>
          </thead>
          <tbody>
            @for (s of items(); track s.id) {
              <tr class="border-t border-amber-100 text-center">
                <td class="p-3 font-bold">{{ s.name }}</td>
                <td class="font-mono text-xs">{{ s.code }}</td>
                <td class="font-bold">{{ s.cost | number:'1.0-2' }}</td>
                <td>{{ s.delivery_days }} يوم</td>
                <td><span class="badge" [class]="s.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'">{{ s.is_active ? 'مفعّل' : 'معطّل' }}</span></td>
                <td class="space-x-2 space-x-reverse">
                  <button (click)="openForm(s)" class="text-blue-700 font-bold text-xs">تعديل</button>
                  <button (click)="remove(s)" class="text-rose-600 text-xs">حذف</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="p-8 text-center text-gray-500">لا توجد شركات شحن.</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (showForm()) {
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="font-extrabold">{{ editing() ? 'تعديل شركة الشحن' : 'إضافة شركة شحن' }}</h3>
              <button type="button" (click)="showForm.set(false)">✕</button>
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
              <button type="button" (click)="showForm.set(false)" class="btn btn-outline">إلغاء</button>
            </div>
          </form>
        </div>
      }
    </div>
  `
})
export class AdminShippingCompaniesComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  readonly items = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  m: any = {};

  ngOnInit(): void { this.load(); }
  load() { this.admin.getShippingCompanies().subscribe({ next: (r) => this.items.set(Array.isArray(r) ? r : r?.data || []) }); }

  openForm(row: any | null) {
    this.editing.set(row);
    this.m = row ? { ...row } : { name: '', code: '', description: '', cost: 0, delivery_days: 2, tracking_url: '', is_active: true };
    this.showForm.set(true);
  }

  save() {
    const row = this.editing();
    const req = row ? this.admin.updateShippingCompany(row.id, this.m) : this.admin.createShippingCompany(this.m);
    req.subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.showForm.set(false); this.load(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }

  remove(s: any) { if (confirm(`حذف "${s.name}"؟`)) this.admin.deleteShippingCompany(s.id).subscribe({ next: () => this.load() }); }
}
