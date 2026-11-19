import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';
import { AdminBannerModalComponent } from '../../components/modals/admin-banner-modal.component';

@Component({
  selector: 'app-admin-banners',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminBannerModalComponent],
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
        <app-admin-banner-modal [editing]="editing()" [activities]="activities()" (close)="showForm.set(false)" (saved)="showForm.set(false); load()" />
      }
    </div>
  `
})
export class AdminBannersComponent implements OnInit {
  private readonly admin = inject(AdminService);

  readonly banners = signal<any[]>([]);
  readonly activities = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  img = resolveAdminImg;

  ngOnInit(): void {
    this.load();
    this.admin.getActivities().subscribe({ next: (r) => this.activities.set(Array.isArray(r) ? r : r?.data || []) });
  }

  load() { this.admin.getBanners().subscribe({ next: (r) => this.banners.set(Array.isArray(r) ? r : r?.data || []) }); }

  openForm(row: any | null) {
    this.editing.set(row);
    this.showForm.set(true);
  }

  remove(b: any) { if (confirm('حذف البنر؟')) this.admin.deleteBanner(b.id).subscribe({ next: () => this.load() }); }
}
