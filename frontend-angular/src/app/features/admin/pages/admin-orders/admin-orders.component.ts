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
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="font-extrabold text-lg">تفاصيل الطلب #{{ ord.order_number }}</h3>
              <button (click)="detailsOrder.set(null)">✕</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm bg-amber-50/50 p-4 rounded-xl">
              <div>
                <p class="text-xs text-gray-500">العميل</p>
                <p class="font-bold">{{ ord.user?.name }} — {{ ord.user?.phone }}</p>
                <p class="text-xs text-gray-600">{{ ord.shipping_address || ord.address }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-500">الدفع والحالة</p>
                <p class="font-bold">{{ ord.payment_method }} • {{ label(ord.status) }}</p>
                <p class="text-xs text-gray-600">المندوب: {{ ord.driver?.name || 'غير مسند' }}</p>
              </div>
            </div>
            <div class="space-y-2">
              <h4 class="font-extrabold text-sm">المنتجات</h4>
              @for (it of ord.items || ord.order_items || []; track it.id) {
                <div class="flex items-center justify-between p-2.5 border rounded-xl text-sm">
                  <div class="flex items-center gap-3">
                    @if (it.product?.image) { <img [src]="img(it.product.image)" class="w-10 h-10 rounded object-cover border" /> }
                    <div>
                      <p class="font-bold">{{ it.product?.name || it.product_name }}</p>
                      <p class="text-xs text-gray-500">الكمية: {{ it.quantity }} × {{ it.price | number:'1.0-2' }}</p>
                    </div>
                  </div>
                  <span class="font-bold">{{ (it.total ?? it.quantity * it.price) | number:'1.0-2' }}</span>
                </div>
              }
            </div>
            <div class="border-t pt-3 text-sm space-y-1">
              <div class="flex justify-between"><span>المجموع الفرعي:</span><span>{{ ord.subtotal | number:'1.0-2' }}</span></div>
              <div class="flex justify-between"><span>التوصيل:</span><span>{{ ord.shipping_cost | number:'1.0-2' }}</span></div>
              <div class="flex justify-between"><span>الضريبة:</span><span>{{ ord.tax_amount | number:'1.0-2' }}</span></div>
              @if (ord.discount_amount) { <div class="flex justify-between text-emerald-700"><span>الخصم:</span><span>-{{ ord.discount_amount | number:'1.0-2' }}</span></div> }
              <div class="flex justify-between font-extrabold text-base border-t pt-2"><span>الإجمالي:</span><span class="text-amber-700">{{ ord.total | number:'1.0-2' }}</span></div>
            </div>
          </div>
        </div>
      }

      <!-- Smart Driver Dispatch Modal -->
      @if (assignOrder()) {
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-3">
            <div class="flex justify-between"><h3 class="font-extrabold">اختيار مندوب للطلب #{{ assignOrder().order_number }}</h3><button (click)="assignOrder.set(null)">✕</button></div>
            @for (d of smart(); track d.id) {
              <div class="p-3 border rounded-xl flex items-center justify-between">
                <div>
                  <p class="font-bold">{{ d.name }} <span class="text-xs text-gray-500">{{ d.phone }}</span></p>
                  <p class="text-xs">
                    <span class="badge" [class]="d.smart_status === 'available' ? 'bg-emerald-100 text-emerald-800' : d.smart_status === 'busy' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-600'">
                      {{ d.smart_status === 'available' ? 'متاح' : d.smart_status === 'busy' ? 'مشغول' : 'غير متصل' }}</span>
                    طلبات نشطة: {{ d.active_orders_count }} @if (d.distance_km !== null) { — {{ d.distance_km }} كم }
                  </p>
                </div>
                <button (click)="assign(d.id)" class="btn btn-success text-xs">إسناد</button>
              </div>
            } @empty { <p class="text-center text-gray-500">لا يوجد مندوبون.</p> }
          </div>
        </div>
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
  readonly smart = signal<any[]>([]);
  filter = '';
  search = '';
  statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  img = resolveAdminImg;

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
    this.admin.getSmartDrivers(o.id).subscribe({ next: (r) => this.smart.set(r?.data || []) });
  }
  assign(driverId: number) {
    this.admin.assignDriver(this.assignOrder().id, driverId).subscribe({
      next: () => { this.toast.success('تم إسناد المندوب'); this.assignOrder.set(null); this.load(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الإسناد')
    });
  }
}
