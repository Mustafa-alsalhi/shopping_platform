import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-banners',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-extrabold">البنرات الإعلانية</h1>
          <p class="text-xs text-gray-500">إدارة بنرات الصفحة الرئيسية والأقسام</p>
        </div>
        <button (click)="openForm(null)" class="btn btn-primary text-sm">+ إضافة بنر</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (b of banners(); track b.id) {
          <div class="card overflow-hidden flex flex-col">
            <div class="h-40 bg-amber-50 relative">
              @if (b.image_url) {
                <img [src]="img(b.image_url)" class="w-full h-full object-cover" />
              }
              <span class="badge absolute top-2 left-2" [class]="b.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'">
                {{ b.is_active ? 'مفعّل' : 'معطّل' }}
              </span>
              <span class="badge bg-black/60 text-white absolute top-2 right-2">{{ b.position || 'home' }} • {{ b.type || 'store' }}</span>
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between space-y-2">
              <div>
                <h3 class="font-extrabold">{{ b.title }}</h3>
                <p class="text-xs text-gray-500 line-clamp-2">{{ b.description }}</p>
              </div>
              <div class="flex items-center justify-between pt-2 border-t border-amber-50 text-xs">
                <span class="text-gray-400">الترتيب: {{ b.sort_order ?? 0 }}</span>
                <div class="space-x-3 space-x-reverse">
                  <button (click)="openForm(b)" class="text-blue-700 font-bold">تعديل</button>
                  <button (click)="remove(b)" class="text-rose-600">حذف</button>
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <div class="card p-10 text-center text-gray-500 md:col-span-2">لا توجد بنرات حالياً.</div>
        }
      </div>

      @if (showForm()) {
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="font-extrabold">{{ editing() ? 'تعديل البنر' : 'إضافة بنر جديد' }}</h3>
              <button type="button" (click)="showForm.set(false)">✕</button>
            </div>
            <div><label class="text-xs font-bold block mb-1">العنوان *</label><input class="input" [(ngModel)]="m.title" name="title" required /></div>
            <div><label class="text-xs font-bold block mb-1">الوصف</label><textarea class="input" rows="2" [(ngModel)]="m.description" name="description"></textarea></div>
            <div>
              <label class="text-xs font-bold block mb-1">صورة البنر *</label>
              <input type="file" accept="image/*" (change)="upload($event)" class="text-xs" />
              <input class="input mt-2 text-xs" [(ngModel)]="m.image_url" name="image_url" placeholder="أو أدخل رابط الصورة" required />
              @if (m.image_url) { <img [src]="img(m.image_url)" class="h-28 w-full object-cover rounded-lg mt-2 border" /> }
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-xs font-bold block mb-1">الرابط عند النقر</label><input class="input" [(ngModel)]="m.link_url" name="link_url" placeholder="/store/products" /></div>
              <div><label class="text-xs font-bold block mb-1">نص الزر</label><input class="input" [(ngModel)]="m.link_text" name="link_text" placeholder="تسوق الآن" /></div>
              <div>
                <label class="text-xs font-bold block mb-1">الموضع</label>
                <select class="input" [(ngModel)]="m.position" name="position">
                  <option value="home_hero">البنر الرئيسي (home_hero)</option>
                  <option value="home_middle">وسط الرئيسية (home_middle)</option>
                  <option value="category_top">أعلى الأقسام (category_top)</option>
                  <option value="sidebar">القائمة الجانبية (sidebar)</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-bold block mb-1">النشاط</label>
                <select class="input" [(ngModel)]="m.type" name="type">
                  <option value="store">متاجر (store)</option>
                  <option value="restaurant">مطاعم (restaurant)</option>
                  @for (a of activities(); track a.id) {
                    @if (a.slug !== 'store' && a.slug !== 'restaurant') {
                      <option [value]="a.slug">{{ a.name }}</option>
                    }
                  }
                </select>
              </div>
              <div><label class="text-xs font-bold block mb-1">الترتيب</label><input type="number" class="input" [(ngModel)]="m.sort_order" name="sort_order" /></div>
              <div class="flex items-end pb-2">
                <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="m.is_active" name="is_active" /> مفعّل</label>
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
export class AdminBannersComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly banners = signal<any[]>([]);
  readonly activities = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  m: any = {};
  img = resolveAdminImg;

  ngOnInit(): void {
    this.load();
    this.admin.getActivities().subscribe({ next: (r) => this.activities.set(Array.isArray(r) ? r : r?.data || []) });
  }

  load() { this.admin.getBanners().subscribe({ next: (r) => this.banners.set(Array.isArray(r) ? r : r?.data || []) }); }

  openForm(row: any | null) {
    this.editing.set(row);
    this.m = row ? { ...row } : { title: '', description: '', image_url: '', link_url: '', link_text: 'تسوق الآن', position: 'home_hero', type: 'store', sort_order: 0, is_active: true };
    this.showForm.set(true);
  }

  upload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.admin.uploadBannerImage(file).subscribe({
      next: (r) => { this.m.image_url = r?.data?.image_url || r?.image_url; this.toast.success('تم رفع صورة البنر'); },
      error: () => this.toast.error('تعذر رفع الصورة')
    });
  }

  save() {
    const row = this.editing();
    const req = row ? this.admin.updateBanner(row.id, this.m) : this.admin.createBanner(this.m);
    req.subscribe({
      next: () => { this.toast.success('تم حفظ البنر'); this.showForm.set(false); this.load(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }

  remove(b: any) { if (confirm('حذف البنر؟')) this.admin.deleteBanner(b.id).subscribe({ next: () => this.load() }); }
}
