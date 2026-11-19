import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { AdminShippingCompanyModalComponent } from '../../components/modals/admin-shipping-company-modal.component';

@Component({
  selector: 'app-admin-shipping-companies',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminShippingCompanyModalComponent],
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
        <app-admin-shipping-company-modal [editing]="editing()" (close)="showForm.set(false)" (saved)="showForm.set(false); load()" />
      }
    </div>
  `
})
export class AdminShippingCompaniesComponent implements OnInit {
  private readonly admin = inject(AdminService);
  readonly items = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);

  ngOnInit(): void { this.load(); }
  load() { this.admin.getShippingCompanies().subscribe({ next: (r) => this.items.set(Array.isArray(r) ? r : r?.data || []) }); }

  openForm(row: any | null) {
    this.editing.set(row);
    this.showForm.set(true);
  }

  remove(s: any) { if (confirm(`حذف "${s.name}"؟`)) this.admin.deleteShippingCompany(s.id).subscribe({ next: () => this.load() }); }
}
