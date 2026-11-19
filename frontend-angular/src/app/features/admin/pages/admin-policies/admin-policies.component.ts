import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { AdminPolicyModalComponent, POLICY_LABELS } from '../../components/modals/admin-policy-modal.component';

@Component({
  selector: 'app-admin-policies',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminPolicyModalComponent],
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
        <app-admin-policy-modal [editing]="editing()" (close)="showForm.set(false)" (saved)="showForm.set(false); load()" />
      }
    </div>
  `
})
export class AdminPoliciesComponent implements OnInit {
  private readonly admin = inject(AdminService);

  readonly policies = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);

  ngOnInit(): void { this.load(); }
  typeLabel(t: string) { return POLICY_LABELS[t] || t; }
  load() { this.admin.getPolicies().subscribe({ next: (r) => this.policies.set(Array.isArray(r) ? r : r?.data || []) }); }

  openForm(row: any | null) {
    this.editing.set(row);
    this.showForm.set(true);
  }

  remove(p: any) { if (confirm(`حذف "${p.title}"؟`)) this.admin.deletePolicy(p.id).subscribe({ next: () => this.load() }); }
}
