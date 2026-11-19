import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';
import { AdminPaymentMethodModalComponent } from '../../components/modals/admin-payment-method-modal.component';

@Component({
  selector: 'app-admin-payment-methods',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminPaymentMethodModalComponent],
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
        <app-admin-payment-method-modal [editing]="editing()" (close)="showForm.set(false)" (saved)="showForm.set(false); load()" />
      }
    </div>
  `
})
export class AdminPaymentMethodsComponent implements OnInit {
  private readonly admin = inject(AdminService);
  readonly methods = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  img = resolveAdminImg;

  ngOnInit(): void { this.load(); }
  load() { this.admin.getPaymentMethods().subscribe({ next: (r) => this.methods.set(Array.isArray(r) ? r : r?.data || []) }); }

  openForm(row: any | null) {
    this.editing.set(row);
    this.showForm.set(true);
  }

  remove(pm: any) { if (confirm(`حذف "${pm.name}"؟`)) this.admin.deletePaymentMethod(pm.id).subscribe({ next: () => this.load() }); }
}
