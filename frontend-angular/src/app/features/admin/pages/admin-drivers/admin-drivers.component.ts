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
import { AdminDriverModalComponent } from '../../components/modals/admin-driver-modal.component';

@Component({
  selector: 'app-admin-drivers',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminDriverModalComponent],
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
        <app-admin-driver-modal [editing]="editing()" (close)="showForm.set(false)" (saved)="showForm.set(false); load()" />
      }
    </div>
  `
})
export class AdminDriversComponent implements OnInit {
  private readonly admin = inject(AdminService);
  readonly drivers = signal<any[]>([]);
  readonly stats = signal<any>(null);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  search = '';

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
    this.showForm.set(true);
  }

  remove(id: number) { if (confirm('حذف المندوب؟')) this.admin.deleteDriver(id).subscribe(() => this.load()); }
}
