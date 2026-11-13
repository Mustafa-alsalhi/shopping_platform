import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DriverService } from '../../../../core/services/driver.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LocationPickerComponent } from '../../../../shared/components/location-picker.component';
import { DRIVER_STATUS_LABELS, ORDER_STATUS_LABELS } from '../../../../shared/constants/order-status';

@Component({
  selector: 'app-driver-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card p-6 space-y-4 max-w-2xl">
      <h1 class="text-xl font-extrabold">إعدادات المندوب</h1>
      <form (ngSubmit)="save()" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label class="text-xs font-bold">الاسم</label><input class="input" [(ngModel)]="f.name" name="n" /></div>
        <div><label class="text-xs font-bold">الجوال</label><input class="input" [(ngModel)]="f.phone" name="p" /></div>
        <div><label class="text-xs font-bold">منطقة العمل</label><input class="input" [(ngModel)]="f.work_zone" name="z" /></div>
        <div><label class="text-xs font-bold">نوع المركبة</label>
          <select class="input" [(ngModel)]="f.vehicle_type" name="v"><option value="motorcycle">دراجة نارية</option><option value="car">سيارة</option><option value="van">فان</option></select></div>
        <div><label class="text-xs font-bold">رقم لوحة المركبة</label><input class="input" [(ngModel)]="f.vehicle_plate_number" name="vp" /></div>
        <div><label class="text-xs font-bold">حساب الكريمي</label><input class="input" [(ngModel)]="f.kuraimi_account" name="k" /></div>
        <div><label class="text-xs font-bold">الصورة الشخصية</label><input type="file" accept="image/*" (change)="file($event, 'avatar')" /></div>
        <div><label class="text-xs font-bold">صورة الهوية</label><input type="file" accept="image/*" (change)="file($event, 'id_image')" /></div>
        <div class="md:col-span-2"><button class="btn btn-primary">حفظ</button></div>
      </form>
    </div>
  `
})
export class DriverSettingsComponent implements OnInit {
  private readonly driver = inject(DriverService);
  private readonly toast = inject(ToastService);
  f: any = { name: '', phone: '', work_zone: '', vehicle_type: 'motorcycle', vehicle_plate_number: '', kuraimi_account: '' };
  files: Record<string, File> = {};

  ngOnInit(): void {
    this.driver.getProfile().subscribe({
      next: (r) => {
        const d = r?.data;
        if (d) this.f = { ...this.f, name: d.name, phone: d.phone, work_zone: d.work_zone || '',
          vehicle_type: d.driver_profile?.vehicle_type || 'motorcycle',
          vehicle_plate_number: d.driver_profile?.vehicle_plate_number || '',
          kuraimi_account: d.driver_profile?.kuraimi_account || '' };
      }
    });
  }

  file(e: Event, key: string) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.files[key] = f;
  }

  save() {
    const fd = new FormData();
    Object.entries(this.f).forEach(([k, v]) => fd.append(k, String(v ?? '')));
    fd.append('vehicle_number', this.f.vehicle_plate_number || '');
    Object.entries(this.files).forEach(([k, v]) => fd.append(k, v));
    this.driver.updateSettings(fd).subscribe({
      next: () => this.toast.success('تم حفظ الإعدادات'),
      error: (err) => this.toast.error(err.error?.message || 'تعذر الحفظ')
    });
  }
}
