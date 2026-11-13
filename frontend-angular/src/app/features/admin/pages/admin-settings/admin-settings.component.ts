import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { ORDER_STATUS_LABELS } from '../../../../shared/constants/order-status';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 max-w-5xl">
      <div>
        <h1 class="text-xl font-extrabold">إعدادات المتجر والنسخ الاحتياطي</h1>
        <p class="text-xs text-gray-500">تخصيص الهوية، روابط التواصل، SEO، وضع الصيانة، والنسخ الاحتياطي</p>
      </div>

      <div class="flex flex-wrap gap-2">
        @for (t of tabs; track t.id) {
          <button (click)="tab = t.id" class="px-4 py-2 rounded-xl text-xs font-bold transition"
            [class]="tab === t.id ? 'bg-amber-600 text-white' : 'bg-white border border-amber-200 text-gray-700'">{{ t.label }}</button>
        }
      </div>

      @if (tab !== 'backups') {
        <form (ngSubmit)="save()" class="card p-6 space-y-5">
          @if (tab === 'general') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (k of generalKeys; track k.key) {
                <div><label class="text-xs font-bold block mb-1">{{ k.label }}</label><input class="input" [(ngModel)]="f[k.key]" [name]="k.key" /></div>
              }
              <div>
                <label class="text-xs font-bold block mb-1">شعار المتجر</label>
                <input type="file" accept="image/*" (change)="file($event, 'store_logo')" class="text-xs" />
                @if (f.store_logo) { <img [src]="img(f.store_logo)" class="h-14 mt-2 rounded border object-contain" /> }
              </div>
              <div>
                <label class="text-xs font-bold block mb-1">أيقونة المتصفح (Favicon)</label>
                <input type="file" accept="image/*" (change)="file($event, 'store_favicon')" class="text-xs" />
                @if (f.store_favicon) { <img [src]="img(f.store_favicon)" class="h-10 mt-2 rounded border object-contain" /> }
              </div>
            </div>
            <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="f.allow_registration" name="ar" /> السماح بتسجيل حسابات جديدة</label>
          }

          @if (tab === 'social') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (k of socialKeys; track k.key) {
                <div><label class="text-xs font-bold block mb-1">{{ k.label }}</label><input class="input" [(ngModel)]="f[k.key]" [name]="k.key" placeholder="https://..." /></div>
              }
            </div>
          }

          @if (tab === 'seo') {
            <div class="space-y-4">
              @for (k of seoKeys; track k.key) {
                <div><label class="text-xs font-bold block mb-1">{{ k.label }}</label><input class="input" [(ngModel)]="f[k.key]" [name]="k.key" /></div>
              }
            </div>
          }

          @if (tab === 'maintenance') {
            <div class="space-y-4">
              <div class="flex flex-wrap gap-6 text-sm font-bold">
                <label class="flex items-center gap-2"><input type="checkbox" [(ngModel)]="f.maintenance_mode" name="mm" /> تفعيل وضع الصيانة</label>
                <label class="flex items-center gap-2"><input type="checkbox" [(ngModel)]="f.maintenance_admin_only" name="ma" /> السماح للمدير فقط بالدخول</label>
              </div>
              <div><label class="text-xs font-bold block mb-1">رسالة الصيانة للزوار</label><textarea class="input" rows="3" [(ngModel)]="f.maintenance_message" name="msg"></textarea></div>
            </div>
          }

          <button class="btn btn-primary">حفظ الإعدادات</button>
        </form>
      } @else {
        <div class="card p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-extrabold">النسخ الاحتياطي لقاعدة البيانات</h2>
            <button (click)="backup()" class="btn btn-primary text-xs">+ إنشاء نسخة احتياطية الآن</button>
          </div>
          @for (b of backups(); track b.name) {
            <div class="flex justify-between items-center text-sm border-b border-amber-100 py-2.5">
              <span><b>{{ b.name }}</b> ({{ b.size }}) — <span class="text-xs text-gray-500">{{ b.created_at }}</span></span>
              <span class="space-x-3 space-x-reverse">
                <button (click)="download(b.name)" class="text-amber-700 font-bold">تحميل</button>
                <button (click)="removeBackup(b.name)" class="text-rose-600">حذف</button>
              </span>
            </div>
          } @empty { <p class="text-sm text-gray-500 text-center py-6">لا توجد نسخ احتياطية بعد.</p> }
        </div>
      }
    </div>
  `
})
export class AdminSettingsComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly http = inject(HttpClient);
  readonly backups = signal<any[]>([]);
  f: any = {};
  files: Record<string, File> = {};
  tab = 'general';
  img = resolveAdminImg;

  tabs = [
    { id: 'general', label: 'عام والهوية' },
    { id: 'social', label: 'التواصل الاجتماعي' },
    { id: 'seo', label: 'تحسين محركات البحث (SEO)' },
    { id: 'maintenance', label: 'وضع الصيانة' },
    { id: 'backups', label: 'النسخ الاحتياطي' }
  ];

  generalKeys = [
    { key: 'store_name', label: 'اسم المتجر' }, { key: 'site_name', label: 'اسم الموقع' },
    { key: 'store_email', label: 'البريد الرسمي' }, { key: 'store_phone', label: 'رقم الهاتف' },
    { key: 'store_address', label: 'العنوان' }, { key: 'store_description', label: 'وصف المتجر' }
  ];
  socialKeys = [
    { key: 'facebook_url', label: 'فيسبوك' }, { key: 'instagram_url', label: 'إنستغرام' },
    { key: 'twitter_url', label: 'تويتر / X' }, { key: 'tiktok_url', label: 'تيك توك' },
    { key: 'youtube_url', label: 'يوتيوب' }, { key: 'telegram_url', label: 'تيليجرام' },
    { key: 'whatsapp_url', label: 'واتساب' }
  ];
  seoKeys = [
    { key: 'seo_title', label: 'عنوان SEO' }, { key: 'seo_description', label: 'وصف SEO' }, { key: 'seo_keywords', label: 'الكلمات المفتاحية SEO' }
  ];

  ngOnInit(): void {
    this.admin.getSettings().subscribe({ next: (s) => (this.f = s || {}) });
    this.loadBackups();
  }
  file(e: Event, k: string) { const x = (e.target as HTMLInputElement).files?.[0]; if (x) this.files[k] = x; }
  save() {
    const fd = new FormData();
    Object.entries(this.f).forEach(([k, v]) => { if (v !== null && v !== undefined && typeof v !== 'object') fd.append(k, String(v)); });
    Object.entries(this.files).forEach(([k, v]) => fd.append(k, v));
    this.admin.updateSettings(fd).subscribe({ next: () => this.toast.success('تم حفظ الإعدادات بنجاح'), error: (e) => this.toast.error(e.error?.message || 'خطأ') });
  }
  loadBackups() { this.admin.listBackups().subscribe({ next: (r) => this.backups.set(r?.backups || []) }); }
  backup() { this.admin.createBackup().subscribe({ next: () => { this.toast.success('تم إنشاء النسخة'); this.loadBackups(); } }); }
  removeBackup(n: string) { if (confirm('حذف النسخة؟')) this.admin.deleteBackup(n).subscribe(() => this.loadBackups()); }
  download(n: string) {
    this.http.get(`${environment.apiUrl}/admin/backups/download/${n}`, { responseType: 'blob' }).subscribe((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = n;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }
}
