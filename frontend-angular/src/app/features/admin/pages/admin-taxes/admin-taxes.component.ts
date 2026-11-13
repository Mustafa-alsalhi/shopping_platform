import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-taxes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-extrabold">الضرائب</h1>
          <p class="text-xs text-gray-500">إدارة ضريبة القيمة المضافة والرسوم الضريبية</p>
        </div>
        <button (click)="openForm(null)" class="btn btn-primary text-sm">+ إضافة ضريبة</button>
      </div>

      <div class="card overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-amber-50 text-xs">
            <tr><th class="p-3">الاسم</th><th class="p-3">القيمة</th><th class="p-3">النوع</th><th class="p-3">افتراضية</th><th class="p-3">الحالة</th><th class="p-3">إجراءات</th></tr>
          </thead>
          <tbody>
            @for (t of taxes(); track t.id) {
              <tr class="border-t border-amber-100 text-center">
                <td class="p-3 font-bold">{{ t.name }}</td>
                <td class="font-bold">{{ t.rate }} {{ t.type === 'percentage' ? '%' : '' }}</td>
                <td>{{ t.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ ثابت' }}</td>
                <td>@if (t.is_default) { <span class="badge bg-amber-100 text-amber-800">افتراضية</span> } @else { — }</td>
                <td><span class="badge" [class]="t.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'">{{ t.is_active ? 'مفعّلة' : 'معطّلة' }}</span></td>
                <td class="space-x-2 space-x-reverse">
                  <button (click)="openForm(t)" class="text-blue-700 font-bold text-xs">تعديل</button>
                  <button (click)="remove(t)" class="text-rose-600 text-xs">حذف</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="p-8 text-center text-gray-500">لا توجد ضرائب.</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (showForm()) {
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="font-extrabold">{{ editing() ? 'تعديل الضريبة' : 'إضافة ضريبة' }}</h3>
              <button type="button" (click)="showForm.set(false)">✕</button>
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
              <button type="button" (click)="showForm.set(false)" class="btn btn-outline">إلغاء</button>
            </div>
          </form>
        </div>
      }
    </div>
  `
})
export class AdminTaxesComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  readonly taxes = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  m: any = {};

  ngOnInit(): void { this.load(); }
  load() { this.admin.getTaxes().subscribe({ next: (r) => this.taxes.set(r || []) }); }

  openForm(row: any | null) {
    this.editing.set(row);
    this.m = row ? { ...row } : { name: '', description: '', rate: 15, type: 'percentage', is_default: false, is_active: true };
    this.showForm.set(true);
  }

  save() {
    const row = this.editing();
    const req = row ? this.admin.updateTax(row.id, this.m) : this.admin.createTax(this.m);
    req.subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.showForm.set(false); this.load(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }

  remove(t: any) { if (confirm(`حذف "${t.name}"؟`)) this.admin.deleteTax(t.id).subscribe({ next: () => this.load() }); }
}
