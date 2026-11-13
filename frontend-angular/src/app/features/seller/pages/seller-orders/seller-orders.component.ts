import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerService } from '../../../../core/services/seller.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ORDER_STATUS_LABELS } from '../../../../shared/constants/order-status';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-extrabold">الطلبات الواردة</h1>
          <p class="text-xs text-gray-500">قبول الطلبات وتحديد وقت التجهيز وتسليمها للمندوب</p>
        </div>
        <div class="flex gap-2">
          <input class="input w-52" [(ngModel)]="search" placeholder="بحث برقم الطلب أو العميل..." />
          <select class="input w-40" [(ngModel)]="filter" (ngModelChange)="load()">
            <option value="">كل الحالات</option><option value="pending">قيد الانتظار</option><option value="processing">قيد التجهيز</option>
            <option value="shipped">تم الشحن</option><option value="delivered">تم التسليم</option><option value="cancelled">ملغي</option>
          </select>
        </div>
      </div>

      @for (o of filtered(); track o.id) {
        <div class="card p-4 space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="font-extrabold">#{{ o.order_number }} — <span class="text-amber-700">{{ o.total | number:'1.0-2' }}</span></p>
              <p class="text-xs text-gray-500">{{ o.user?.name }} — {{ o.user?.phone }} • {{ o.created_at | date:'short' }}</p>
            </div>
            <div class="flex gap-2 items-center">
              <span class="badge bg-amber-100 text-amber-800">{{ label(o.status) }}</span>
              <span class="badge bg-slate-100 text-slate-700">{{ o.seller_status || 'pending_approval' }}</span>
              <button (click)="details.set(o)" class="btn btn-outline text-xs py-1 px-2.5">التفاصيل</button>
            </div>
          </div>
          <div class="text-sm space-y-1">
            @for (it of o.items; track it.id) {
              <p>• {{ it.product?.name || it.product_name }} × {{ it.quantity }} — {{ it.total | number:'1.0-2' }}</p>
            }
          </div>
          <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-amber-100">
            @if (o.seller_status === 'pending_approval' || !o.seller_status) {
              <input class="input w-40 text-xs" [(ngModel)]="prep[o.id]" placeholder="وقت التجهيز (دقيقة)" />
              <button (click)="act(o, { seller_status: 'approved', preparation_time: prep[o.id] })" class="btn btn-success text-xs py-1.5 px-3">قبول الطلب</button>
              <button (click)="act(o, { seller_status: 'rejected' })" class="btn btn-error text-xs py-1.5 px-3">رفض</button>
            }
            @if (o.seller_status === 'approved') {
              <button (click)="act(o, { seller_status: 'preparing' })" class="btn btn-primary text-xs py-1.5 px-3">بدء التجهيز</button>
            }
            @if (o.seller_status === 'preparing') {
              <button (click)="act(o, { seller_status: 'ready' })" class="btn btn-primary text-xs py-1.5 px-3">الطلب جاهز للمندوب</button>
            }
          </div>
        </div>
      } @empty { <div class="card p-10 text-center text-gray-500">لا توجد طلبات.</div> }

      @if (details(); as ord) {
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[88vh] overflow-y-auto space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="font-extrabold">تفاصيل الطلب #{{ ord.order_number }}</h3>
              <button (click)="details.set(null)">✕</button>
            </div>
            <div class="text-sm bg-amber-50/50 p-3 rounded-xl space-y-1">
              <p><b>العميل:</b> {{ ord.user?.name }} — {{ ord.user?.phone }}</p>
              <p><b>العنوان:</b> {{ ord.shipping_address || ord.address }}</p>
              <p><b>الدفع:</b> {{ ord.payment_method || '—' }}</p>
            </div>
            <div class="space-y-2">
              @for (it of ord.items; track it.id) {
                <div class="flex items-center justify-between p-2 border rounded-xl text-sm">
                  <div class="flex items-center gap-2.5">
                    @if (it.product?.image) { <img [src]="img(it.product.image)" class="w-10 h-10 rounded object-cover border" /> }
                    <div><p class="font-bold">{{ it.product?.name || it.product_name }}</p><p class="text-xs text-gray-500">{{ it.quantity }} × {{ it.price | number:'1.0-2' }}</p></div>
                  </div>
                  <span class="font-bold">{{ it.total | number:'1.0-2' }}</span>
                </div>
              }
            </div>
            <div class="flex justify-between font-extrabold border-t pt-2"><span>الإجمالي:</span><span class="text-amber-700">{{ ord.total | number:'1.0-2' }}</span></div>
          </div>
        </div>
      }
    </div>
  `
})
export class SellerOrdersComponent implements OnInit {
  private readonly seller = inject(SellerService);
  private readonly toast = inject(ToastService);
  readonly orders = signal<any[]>([]);
  readonly details = signal<any>(null);
  filter = ''; search = ''; prep: Record<number, string> = {};
  img = resolveAdminImg;

  readonly filtered = computed(() => {
    const q = this.search.trim().toLowerCase();
    return this.orders().filter(o => !q || String(o.order_number || '').toLowerCase().includes(q) || (o.user?.name || '').toLowerCase().includes(q));
  });

  ngOnInit(): void { this.load(); }
  load() { this.seller.getOrders(this.filter).subscribe({ next: (r) => this.orders.set(r?.data || r || []) }); }
  act(o: any, payload: any) {
    this.seller.updateOrderStatus(o.id, payload).subscribe({
      next: () => { this.toast.success('تم تحديث الطلب'); this.load(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر التحديث')
    });
  }
  label(s: string) { return ORDER_STATUS_LABELS[s] || s; }
}
