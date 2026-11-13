import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
            <div class="flex justify-between items-center border-b border-amber-100 pb-2">
              <h3 class="font-extrabold">{{ editing() ? 'تعديل القسم' : 'إضافة قسم جديد' }}</h3>
              <button type="button" (click)="showForm.set(false)">✕</button>
            </div>
            <div><label class="text-xs font-bold block mb-1">اسم القسم *</label><input class="input" [(ngModel)]="m.name" name="name" required /></div>
            <div><label class="text-xs font-bold block mb-1">المعرف (Slug)</label><input class="input" [(ngModel)]="m.slug" name="slug" placeholder="يُنشأ تلقائياً إذا تُرك فارغاً" /></div>
            <div>
              <label class="text-xs font-bold block mb-1">النشاط التابع له</label>
              <select class="input" [(ngModel)]="m.type" name="type">
                <option value="store">متاجر (store)</option>
                <option value="restaurant">مطاعم (restaurant)</option>
                @for (a of activities(); track a.id) {
                  @if (a.slug !== 'store' && a.slug !== 'restaurant') {
                    <option [value]="a.slug">{{ a.name }} ({{ a.slug }})</option>
                  }
                }
              </select>
            </div>
            <div><label class="text-xs font-bold block mb-1">الوصف</label><textarea class="input" rows="2" [(ngModel)]="m.description" name="description"></textarea></div>
            <div>
              <label class="text-xs font-bold block mb-1">صورة القسم</label>
              <input type="file" accept="image/*" (change)="upload($event)" class="text-xs" />
              <input class="input mt-2 text-xs" [(ngModel)]="m.image" name="image" placeholder="أو رابط الصورة" />
              @if (m.image) { <img [src]="img(m.image)" class="h-16 mt-2 rounded-lg border object-cover" /> }
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-bold block mb-1">الحالة</label>
                <select class="input" [(ngModel)]="m.status" name="status">
                  <option value="active">نشط</option><option value="inactive">غير نشط</option>
                </select>
              </div>
              <div class="flex items-end pb-2">
                <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="m.featured" name="featured" /> يظهر في الرئيسية</label>
              </div>
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
export class AdminCategoriesComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly categories = signal<any[]>([]);
  readonly activities = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  search = '';
  typeFilter = '';
  m: any = {};
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
    this.m = row ? { ...row } : { name: '', slug: '', type: 'store', description: '', image: '', status: 'active', featured: false };
    this.showForm.set(true);
  }

  upload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.admin.uploadCategoryImage(file).subscribe({
      next: (r) => { this.m.image = r.image_url || r.data?.image_url; this.toast.success('تم رفع الصورة'); },
      error: () => this.toast.error('تعذر رفع الصورة')
    });
  }

  save() {
    const row = this.editing();
    const req = row ? this.admin.updateCategory(row.id, this.m) : this.admin.createCategory(this.m);
    req.subscribe({
      next: () => { this.toast.success('تم حفظ القسم'); this.showForm.set(false); this.load(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }

  remove(c: any) {
    if (!confirm(`حذف القسم "${c.name}"؟`)) return;
    this.admin.deleteCategory(c.id).subscribe({ next: () => { this.toast.success('تم الحذف'); this.load(); } });
  }
}
