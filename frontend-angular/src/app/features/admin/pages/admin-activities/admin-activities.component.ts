import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-admin-activities',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="font-extrabold">{{ editing() ? 'تعديل النشاط' : 'إضافة نشاط جديد' }}</h3>
              <button type="button" (click)="showForm.set(false)">✕</button>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-xs font-bold block mb-1">اسم النشاط *</label><input class="input" [(ngModel)]="m.name" name="name" required /></div>
              <div><label class="text-xs font-bold block mb-1">المعرف (Slug)</label><input class="input" [(ngModel)]="m.slug" name="slug" placeholder="مثال: pharmacy" /></div>
            </div>
            <div>
              <label class="text-xs font-bold block mb-1">الأيقونة</label>
              <div class="flex gap-2 items-center">
                <input class="input w-24 text-center text-xl" [(ngModel)]="m.icon" name="icon" />
                <div class="flex flex-wrap gap-1">
                  @for (ic of iconPresets; track ic) {
                    <button type="button" (click)="m.icon = ic" class="px-2 py-1 rounded border hover:bg-amber-50">{{ ic }}</button>
                  }
                </div>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-bold block mb-1">لون الواجهة</label>
                <div class="flex gap-2 items-center">
                  <input type="color" [(ngModel)]="m.theme_color" name="theme_color" class="w-10 h-9 rounded border cursor-pointer" />
                  <input class="input text-xs" [(ngModel)]="m.theme_color" name="theme_color_hex" />
                </div>
              </div>
              <div><label class="text-xs font-bold block mb-1">الترتيب</label><input type="number" class="input" [(ngModel)]="m.sort_order" name="sort_order" /></div>
            </div>
            <div><label class="text-xs font-bold block mb-1">الوصف</label><textarea class="input" rows="2" [(ngModel)]="m.description" name="description"></textarea></div>
            <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="m.is_active" name="is_active" /> نشاط مفعّل</label>
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
export class AdminActivitiesComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly activities = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  iconPresets = ['🛍️', '🍔', '💊', '🛒', '💐', '📱', '☕', '🎁', '🍰', '🐾'];
  m: any = {};

  ngOnInit(): void { this.load(); }
  load() { this.admin.getActivities().subscribe({ next: (r) => this.activities.set(Array.isArray(r) ? r : r?.data || []) }); }

  openForm(row: any | null) {
    this.editing.set(row);
    this.m = row ? { ...row } : { name: '', slug: '', icon: '🛍️', description: '', sort_order: 0, theme_color: '#d97706', is_active: true };
    this.showForm.set(true);
  }

  save() {
    const row = this.editing();
    const req = row ? this.admin.updateActivity(row.id, this.m) : this.admin.createActivity(this.m);
    req.subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.showForm.set(false); this.load(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }

  toggle(a: any) { this.admin.toggleActivity(a.id).subscribe({ next: () => this.load() }); }
  remove(a: any) { if (confirm(`حذف النشاط "${a.name}"؟`)) this.admin.deleteActivity(a.id).subscribe({ next: () => this.load() }); }
}
