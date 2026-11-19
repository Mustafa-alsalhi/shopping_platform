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
import { AdminOrderModalComponent } from '../../components/modals/admin-order-modal.component';
import { AdminOrderAssignModalComponent } from '../../components/modals/admin-order-assign-modal.component';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminOrderModalComponent, AdminOrderAssignModalComponent],
  template: `
    <div class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-extrabold">إدارة الطلبات والتوصيل</h1>
          <p class="text-xs text-gray-500">متابعة حالات الطلبات، عرض التفاصيل، وإسناد المندوبين</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <input class="input w-56" [(ngModel)]="search" placeholder="بحث برقم الطلب أو العميل..." />
          <select class="input w-44" [(ngModel)]="filter" (ngModelChange)="load()">
            <option value="">كل الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="processing">قيد التجهيز</option>
            <option value="shipped">تم الشحن</option>
            <option value="delivered">تم التسليم</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>
      </div>

      <div class="card overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-amber-50 text-xs">
            <tr><th class="p-3">الطلب</th><th class="p-3">العميل</th><th class="p-3">الإجمالي</th><th class="p-3">الدفع</th><th class="p-3">الحالة</th><th class="p-3">المندوب</th><th class="p-3">إجراءات</th></tr>
          </thead>
          <tbody>
            @for (o of filtered(); track o.id) {
              <tr class="border-t border-amber-100 text-center">
                <td class="p-3 font-bold">#{{ o.order_number }}</td>
                <td>{{ o.user?.name }}<br /><span class="text-xs text-gray-400">{{ o.user?.phone }}</span></td>
                <td class="font-bold">{{ o.total | number:'1.0-2' }}</td>
                <td class="text-xs">{{ o.payment_method || '—' }}</td>
                <td>
                  <select class="input w-36 text-xs" [ngModel]="o.status" (ngModelChange)="setStatus(o, $event)">
                    @for (s of statuses; track s) { <option [value]="s">{{ label(s) }}</option> }
                  </select>
                </td>
                <td>{{ o.driver?.name || '—' }}</td>
                <td class="space-x-2 space-x-reverse whitespace-nowrap">
                  <button (click)="viewOrder(o)" class="btn btn-outline text-xs py-1 px-2">تفاصيل</button>
                  <button (click)="openAssign(o)" class="btn btn-primary text-xs py-1 px-2">إسناد مندوب</button>
                  <button (click)="remove(o.id)" class="text-rose-600 text-xs">حذف</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="p-8 text-center text-gray-500">لا توجد طلبات.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Order Details Modal -->
      @if (detailsOrder(); as ord) {
        <app-admin-order-modal [order]="ord" (close)="detailsOrder.set(null)" />
      }

      <!-- Smart Driver Dispatch Modal -->
      @if (assignOrder(); as ord) {
        <app-admin-order-assign-modal [order]="ord" (close)="assignOrder.set(null)" (assigned)="assignOrder.set(null); load()" />
      }
    </div>
  `
})
export class AdminOrdersComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  readonly orders = signal<any[]>([]);
  readonly detailsOrder = signal<any>(null);
  readonly assignOrder = signal<any>(null);
  filter = '';
  search = '';
  statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

  readonly filtered = computed(() => {
    const q = this.search.trim().toLowerCase();
    return this.orders().filter(o => !q || String(o.order_number || '').toLowerCase().includes(q) || (o.user?.name || '').toLowerCase().includes(q) || (o.user?.phone || '').includes(q));
  });

  ngOnInit(): void { this.load(); }
  load() { this.admin.getOrders(this.filter).subscribe({ next: (o) => this.orders.set(o || []) }); }
  label(s: string) { return ORDER_STATUS_LABELS[s] || s; }
  setStatus(o: any, status: string) {
    this.admin.updateOrderStatus(o.id, status).subscribe({ next: () => { this.toast.success('تم تحديث الحالة'); this.load(); } });
  }
  viewOrder(o: any) {
    this.detailsOrder.set(o);
    this.admin.getOrder(o.id).subscribe({ next: (full) => { if (full) this.detailsOrder.set(full); } });
  }
  remove(id: number) { if (confirm('حذف الطلب نهائياً؟')) this.admin.deleteOrder(id).subscribe(() => this.load()); }
  openAssign(o: any) {
    this.assignOrder.set(o);
  }
}
