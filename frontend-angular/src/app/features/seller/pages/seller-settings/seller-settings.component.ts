import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerService } from '../../../../core/services/seller.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LocationPickerComponent } from '../../../../shared/components/location-picker.component';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-seller-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LocationPickerComponent],
  template: `
    <div class="space-y-5 max-w-4xl">
      <div>
        <h1 class="text-xl font-extrabold">إعدادات المتجر والموقع</h1>
        <p class="text-xs text-gray-500">تحديث بيانات المتجر، الشعار والغلاف، الموقع الجغرافي، والحساب البنكي</p>
      </div>

      <div class="flex flex-wrap gap-2">
        @for (t of tabs; track t.id) {
          <button (click)="tab = t.id" class="px-4 py-2 rounded-xl text-xs font-bold transition"
            [class]="tab === t.id ? 'bg-amber-600 text-white' : 'bg-white border border-amber-200 text-gray-700'">{{ t.label }}</button>
        }
      </div>

      <form (ngSubmit)="save()" class="card p-6 space-y-5">
        @if (tab === 'info') {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label class="text-xs font-bold block mb-1">اسم المتجر / المطعم</label><input class="input" [(ngModel)]="f.name" name="name" /></div>
            <div><label class="text-xs font-bold block mb-1">الهاتف</label><input class="input" [(ngModel)]="f.phone" name="phone" /></div>
            <div><label class="text-xs font-bold block mb-1">البريد الإلكتروني</label><input class="input" [(ngModel)]="f.email" name="email" /></div>
            <div><label class="text-xs font-bold block mb-1">العنوان</label><input class="input" [(ngModel)]="f.address" name="address" /></div>
          </div>
          <div><label class="text-xs font-bold block mb-1">وصف المتجر</label><textarea class="input" rows="3" [(ngModel)]="f.description" name="description"></textarea></div>
        }

        @if (tab === 'media') {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="text-xs font-bold block mb-1">شعار المتجر (Logo)</label>
              <input type="file" accept="image/*" (change)="onFile($event, 'logo')" class="text-xs" />
              @if (logoPreview() || f.logo) { <img [src]="logoPreview() || img(f.logo)" class="h-24 w-24 mt-2 rounded-xl border object-cover" /> }
            </div>
            <div>
              <label class="text-xs font-bold block mb-1">صورة الغلاف (Cover)</label>
              <input type="file" accept="image/*" (change)="onFile($event, 'cover')" class="text-xs" />
              @if (coverPreview() || f.cover_image) { <img [src]="coverPreview() || img(f.cover_image)" class="h-24 w-full mt-2 rounded-xl border object-cover" /> }
            </div>
          </div>
        }

        @if (tab === 'location') {
          <app-location-picker [latitude]="f.latitude" [longitude]="f.longitude" (locationChange)="f.latitude = $event.lat; f.longitude = $event.lng" />
        }

        @if (tab === 'bank') {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label class="text-xs font-bold block mb-1">اسم صاحب الحساب (الكريمي)</label><input class="input" [(ngModel)]="f.kuraimi_account_name" name="kan" /></div>
            <div><label class="text-xs font-bold block mb-1">رقم الحساب (الكريمي)</label><input class="input" [(ngModel)]="f.kuraimi_account_number" name="kanum" /></div>
          </div>
        }

        <button class="btn btn-primary" [disabled]="saving()">{{ saving() ? 'جاري الحفظ...' : 'حفظ التعديلات' }}</button>
      </form>
    </div>
  `
})
export class SellerSettingsComponent implements OnInit {
  private readonly seller = inject(SellerService);
  private readonly toast = inject(ToastService);
  readonly saving = signal(false);
  readonly logoPreview = signal('');
  readonly coverPreview = signal('');
  f: any = {};
  logoFile: File | null = null;
  coverFile: File | null = null;
  tab = 'info';
  img = resolveAdminImg;

  tabs = [
    { id: 'info', label: 'البيانات الأساسية' },
    { id: 'media', label: 'الشعار والغلاف' },
    { id: 'location', label: 'الموقع الجغرافي' },
    { id: 'bank', label: 'بيانات الحساب البنكي' }
  ];

  ngOnInit(): void {
    this.seller.getSettings().subscribe({ next: (r) => this.f = r?.data || r || {} });
  }

  onFile(e: Event, kind: 'logo' | 'cover') {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (kind === 'logo') { this.logoFile = file; this.logoPreview.set(URL.createObjectURL(file)); }
    else { this.coverFile = file; this.coverPreview.set(URL.createObjectURL(file)); }
  }

  save() {
    this.saving.set(true);
    const fd = new FormData();
    ['name', 'phone', 'email', 'address', 'description', 'kuraimi_account_name', 'kuraimi_account_number', 'latitude', 'longitude'].forEach(k => {
      if (this.f[k] !== null && this.f[k] !== undefined) fd.append(k, String(this.f[k]));
    });
    if (this.logoFile) fd.append('logo', this.logoFile);
    if (this.coverFile) fd.append('cover_image', this.coverFile);

    this.seller.updateSettings(fd).subscribe({
      next: () => { this.saving.set(false); this.toast.success('تم حفظ إعدادات المتجر'); },
      error: (e) => { this.saving.set(false); this.toast.error(e.error?.message || 'تعذر الحفظ'); }
    });
  }
}
