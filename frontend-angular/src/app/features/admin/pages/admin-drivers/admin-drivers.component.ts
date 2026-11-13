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
  selector: 'app-admin-drivers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-extrabold">مندوبو التوصيل</h1>
          <p class="text-xs text-gray-500">إدارة حسابات المندوبين، مناطق العمل، والمركبات</p>
        </div>
        <button (click)="openForm(null)" class="btn btn-primary text-sm">+ إضافة مندوب</button>
      </div>

      @if (stats(); as s) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-center text-sm">
          <div class="card p-3.5"><p class="text-xs text-gray-500">الإجمالي</p><b class="text-xl">{{ s.total_drivers }}</b></div>
          <div class="card p-3.5"><p class="text-xs text-gray-500">متصل الآن</p><b class="text-xl text-emerald-700">{{ s.online_drivers }}</b></div>
          <div class="card p-3.5"><p class="text-xs text-gray-500">نشط</p><b class="text-xl text-blue-700">{{ s.active_drivers }}</b></div>
          <div class="card p-3.5"><p class="text-xs text-gray-500">توصيلات جارية</p><b class="text-xl text-amber-700">{{ s.active_deliveries }}</b></div>
        </div>
      }

      <div class="card p-3"><input class="input" [(ngModel)]="search" placeholder="ابحث بالاسم أو الجوال أو منطقة العمل..." /></div>

      @for (d of filtered(); track d.id) {
        <div class="card p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="font-bold">{{ d.name }} <span class="text-xs">{{ d.is_online ? '🟢 متصل' : '⚪ غير متصل' }}</span></p>
            <p class="text-xs text-gray-500">{{ d.phone }} — {{ d.work_zone || 'كل المناطق' }} — {{ d.driver?.vehicle_type || d.vehicle_type }} ({{ d.driver?.vehicle_number || d.vehicle_number || '—' }})</p>
          </div>
          <div class="space-x-3 space-x-reverse text-xs">
            <button (click)="openForm(d)" class="text-blue-700 font-bold">تعديل</button>
            <button (click)="remove(d.id)" class="text-rose-600">حذف</button>
          </div>
        </div>
      } @empty { <div class="card p-10 text-center text-gray-500">لا يوجد مندوبون.</div> }

      @if (showForm()) {
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="font-extrabold">{{ editing() ? 'تعديل المندوب' : 'إضافة مندوب جديد' }}</h3>
              <button type="button" (click)="showForm.set(false)">✕</button>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-xs font-bold block mb-1">الاسم *</label><input class="input" [(ngModel)]="m.name" name="name" required /></div>
              <div><label class="text-xs font-bold block mb-1">الجوال *</label><input class="input" [(ngModel)]="m.phone" name="phone" required /></div>
              <div><label class="text-xs font-bold block mb-1">البريد الإلكتروني</label><input type="email" class="input" [(ngModel)]="m.email" name="email" /></div>
              <div><label class="text-xs font-bold block mb-1">كلمة المرور {{ editing() ? '(اختياري)' : '*' }}</label><input type="password" class="input" [(ngModel)]="m.password" name="password" [required]="!editing()" /></div>
              <div><label class="text-xs font-bold block mb-1">منطقة العمل</label><input class="input" [(ngModel)]="m.work_zone" name="work_zone" /></div>
              <div>
                <label class="text-xs font-bold block mb-1">نوع المركبة</label>
                <select class="input" [(ngModel)]="m.vehicle_type" name="vehicle_type"><option value="motorcycle">دراجة نارية</option><option value="car">سيارة</option><option value="van">فان</option></select>
              </div>
              <div><label class="text-xs font-bold block mb-1">رقم اللوحة</label><input class="input" [(ngModel)]="m.vehicle_number" name="vehicle_number" /></div>
              <div><label class="text-xs font-bold block mb-1">رقم الرخصة</label><input class="input" [(ngModel)]="m.license_number" name="license_number" /></div>
            </div>
            <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="m.is_active" name="is_active" /> نشط</label>
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
export class AdminDriversComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  readonly drivers = signal<any[]>([]);
  readonly stats = signal<any>(null);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  search = '';
  m: any = {};

  readonly filtered = computed(() => {
    const q = this.search.trim().toLowerCase();
    return this.drivers().filter(d => !q || (d.name || '').toLowerCase().includes(q) || (d.phone || '').includes(q) || (d.work_zone || '').toLowerCase().includes(q));
  });

  ngOnInit(): void { this.load(); }
  load() {
    this.admin.getDrivers().subscribe({ next: (r) => this.drivers.set(r?.data || r || []) });
    this.admin.getDriverStats().subscribe({ next: (r) => this.stats.set(r?.data || r) });
  }

  openForm(d: any | null) {
    this.editing.set(d);
    this.m = d
      ? { name: d.name, phone: d.phone || '', email: d.email || '', password: '', work_zone: d.work_zone || '', vehicle_type: d.driver?.vehicle_type || d.vehicle_type || 'motorcycle', vehicle_number: d.driver?.vehicle_number || d.vehicle_number || '', license_number: d.driver?.license_number || '', is_active: d.is_active ?? true }
      : { name: '', phone: '', email: '', password: '', work_zone: '', vehicle_type: 'motorcycle', vehicle_number: '', license_number: '', is_active: true };
    this.showForm.set(true);
  }

  save() {
    const d = this.editing();
    const payload = { ...this.m };
    if (d && !payload.password) delete payload.password;
    const req = d ? this.admin.updateDriver(d.id, payload) : this.admin.createDriver(payload);
    req.subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.showForm.set(false); this.load(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }

  remove(id: number) { if (confirm('حذف المندوب؟')) this.admin.deleteDriver(id).subscribe(() => this.load()); }
}
