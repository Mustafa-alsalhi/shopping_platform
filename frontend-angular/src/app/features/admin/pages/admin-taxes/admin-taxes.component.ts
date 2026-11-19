import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { AdminTaxModalComponent } from '../../components/modals/admin-tax-modal.component';

@Component({
  selector: 'app-admin-taxes',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminTaxModalComponent],
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
        <app-admin-tax-modal [editing]="editing()" (close)="showForm.set(false)" (saved)="showForm.set(false); load()" />
      }
    </div>
  `
})
export class AdminTaxesComponent implements OnInit {
  private readonly admin = inject(AdminService);
  readonly taxes = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);

  ngOnInit(): void { this.load(); }
  load() { this.admin.getTaxes().subscribe({ next: (r) => this.taxes.set(r || []) }); }

  openForm(row: any | null) {
    this.editing.set(row);
    this.showForm.set(true);
  }

  remove(t: any) { if (confirm(`حذف "${t.name}"؟`)) this.admin.deleteTax(t.id).subscribe({ next: () => this.load() }); }
}
