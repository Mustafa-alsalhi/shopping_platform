import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';
import { AdminCategoryModalComponent } from '../../components/modals/admin-category-modal.component';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminCategoryModalComponent],
  template: `
    <div class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-extrabold">الأقسام والتصنيفات</h1>
          <p class="text-xs text-gray-500">إدارة أقسام المتاجر والمطاعم والأنشطة</p>
        </div>
        <button (click)="openForm(null)" class="btn btn-primary text-sm">+ إضافة قسم</button>
      </div>

      <div class="card p-3 flex flex-wrap gap-3">
        <input class="input flex-1 min-w-[200px]" [(ngModel)]="search" placeholder="ابحث عن قسم..." />
        <select class="input w-44" [(ngModel)]="typeFilter" (ngModelChange)="load()">
          <option value="">كل الأنشطة</option>
          <option value="store">متاجر (store)</option>
          <option value="restaurant">مطاعم (restaurant)</option>
          @for (a of activities(); track a.id) {
            @if (a.slug !== 'store' && a.slug !== 'restaurant') {
              <option [value]="a.slug">{{ a.name }}</option>
            }
          }
        </select>
      </div>

      <div class="card overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-amber-50 text-xs">
            <tr><th class="p-3 text-right">القسم</th><th class="p-3">المعرف</th><th class="p-3">النشاط</th><th class="p-3">مميز</th><th class="p-3">الحالة</th><th class="p-3">إجراءات</th></tr>
          </thead>
          <tbody>
            @for (c of filtered(); track c.id) {
              <tr class="border-t border-amber-100">
                <td class="p-3">
                  <div class="flex items-center gap-3">
                    @if (c.image) {
                      <img [src]="img(c.image)" class="w-10 h-10 rounded-lg object-cover border" />
                    } @else {
                      <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800 font-bold">{{ c.name?.[0] }}</div>
                    }
                    <div>
                      <p class="font-bold">{{ c.name }}</p>
                      <p class="text-xs text-gray-500 line-clamp-1">{{ c.description }}</p>
                    </div>
                  </div>
                </td>
                <td class="p-3 text-center text-xs font-mono">{{ c.slug }}</td>
                <td class="p-3 text-center"><span class="badge bg-amber-100 text-amber-800">{{ c.type }}</span></td>
                <td class="p-3 text-center">{{ c.featured ? '★ نعم' : '—' }}</td>
                <td class="p-3 text-center">
                  <span class="badge" [class]="c.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'">
                    {{ c.status === 'active' ? 'نشط' : 'غير نشط' }}
                  </span>
                </td>
                <td class="p-3 text-center space-x-2 space-x-reverse">
                  <button (click)="openForm(c)" class="text-blue-700 font-bold text-xs">تعديل</button>
                  <button (click)="remove(c)" class="text-rose-600 text-xs">حذف</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="p-8 text-center text-gray-500">لا توجد أقسام.</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (showForm()) {
        <app-admin-category-modal [editing]="editing()" [activities]="activities()" (close)="showForm.set(false)" (saved)="showForm.set(false); load()" />
      }
    </div>
  `
})
export class AdminCategoriesComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly categories = signal<any[]>([]);
  readonly activities = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  search = '';
  typeFilter = '';
  img = resolveAdminImg;

  readonly filtered = computed(() => {
    const q = this.search.trim().toLowerCase();
    return this.categories().filter(c => !q || (c.name || '').toLowerCase().includes(q) || (c.slug || '').toLowerCase().includes(q));
  });

  ngOnInit(): void {
    this.load();
    this.admin.getActivities().subscribe({ next: (r) => this.activities.set(Array.isArray(r) ? r : r?.data || []) });
  }

  load() { this.admin.getCategories(this.typeFilter).subscribe({ next: (r) => this.categories.set(r || []) }); }

  openForm(row: any | null) {
    this.editing.set(row);
    this.showForm.set(true);
  }

  remove(c: any) {
    if (!confirm(`حذف القسم "${c.name}"؟`)) return;
    this.admin.deleteCategory(c.id).subscribe({ next: () => { this.toast.success('تم الحذف'); this.load(); } });
  }
}
