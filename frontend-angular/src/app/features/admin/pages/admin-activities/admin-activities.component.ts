import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { AdminActivityModalComponent } from '../../components/modals/admin-activity-modal.component';

@Component({
  selector: 'app-admin-activities',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminActivityModalComponent],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-extrabold">الأنشطة الديناميكية</h1>
          <p class="text-xs text-gray-500">إدارة أنشطة المنصة (متاجر، مطاعم، صيدليات، سوبرماركت...)</p>
        </div>
        <button (click)="openForm(null)" class="btn btn-primary text-sm">+ إضافة نشاط</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (a of activities(); track a.id) {
          <div class="card p-4 space-y-3 border-t-4" [style.border-top-color]="a.theme_color || '#d97706'">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-xl flex items-center justify-center text-2xl bg-amber-50 border">{{ a.icon || '🏪' }}</div>
                <div>
                  <h3 class="font-extrabold">{{ a.name }}</h3>
                  <p class="text-xs font-mono text-gray-500">{{ a.slug }} • ترتيب: {{ a.sort_order ?? 0 }}</p>
                </div>
              </div>
              <button (click)="toggle(a)" class="badge cursor-pointer" [class]="a.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'">
                {{ a.is_active ? 'مفعّل' : 'معطّل' }}
              </button>
            </div>
            <p class="text-xs text-gray-600 min-h-[32px]">{{ a.description || 'بدون وصف' }}</p>
            <div class="flex justify-end gap-3 pt-2 border-t border-amber-50 text-xs">
              <button (click)="openForm(a)" class="text-blue-700 font-bold">تعديل</button>
              <button (click)="remove(a)" class="text-rose-600">حذف</button>
            </div>
          </div>
        } @empty {
          <div class="card p-10 text-center text-gray-500 md:col-span-3">لا توجد أنشطة مسجلة.</div>
        }
      </div>

      @if (showForm()) {
        <app-admin-activity-modal [editing]="editing()" (close)="showForm.set(false)" (saved)="showForm.set(false); load()" />
      }
    </div>
  `
})
export class AdminActivitiesComponent implements OnInit {
  private readonly admin = inject(AdminService);

  readonly activities = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);

  ngOnInit(): void { this.load(); }
  load() { this.admin.getActivities().subscribe({ next: (r) => this.activities.set(Array.isArray(r) ? r : r?.data || []) }); }

  openForm(row: any | null) {
    this.editing.set(row);
    this.showForm.set(true);
  }

  toggle(a: any) { this.admin.toggleActivity(a.id).subscribe({ next: () => this.load() }); }
  remove(a: any) { if (confirm(`حذف النشاط "${a.name}"؟`)) this.admin.deleteActivity(a.id).subscribe({ next: () => this.load() }); }
}
