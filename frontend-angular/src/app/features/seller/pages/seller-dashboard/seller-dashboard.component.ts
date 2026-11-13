import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SellerService } from '../../../../core/services/seller.service';
import { ORDER_STATUS_LABELS } from '../../../../shared/constants/order-status';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-extrabold">لوحة تحكم المتجر</h1>
          <p class="text-xs text-gray-500">ملخص المبيعات، الطلبات الواردة، وأداء المنتجات</p>
        </div>
        <div class="flex flex-wrap gap-2 text-xs">
          <a routerLink="/seller/orders" class="btn btn-outline py-1.5 px-3">الطلبات الواردة</a>
          <a routerLink="/seller/products/new" class="btn btn-primary py-1.5 px-3">+ منتج جديد</a>
          <a routerLink="/seller/offers" class="btn btn-outline py-1.5 px-3">العروض</a>
          <a routerLink="/seller/settings" class="btn btn-outline py-1.5 px-3">إعدادات المتجر</a>
        </div>
      </div>

      @if (s(); as d) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="card p-4"><p class="text-xs text-gray-500">إجمالي الطلبات</p><p class="text-2xl font-extrabold">{{ d.total_orders ?? 0 }}</p></div>
          <div class="card p-4"><p class="text-xs text-gray-500">قيد المعالجة</p><p class="text-2xl font-extrabold text-blue-700">{{ d.pending_orders ?? 0 }}</p></div>
          <div class="card p-4"><p class="text-xs text-gray-500">المكتملة</p><p class="text-2xl font-extrabold text-emerald-700">{{ d.completed_orders ?? 0 }}</p></div>
          <div class="card p-4"><p class="text-xs text-gray-500">المنتجات</p><p class="text-2xl font-extrabold">{{ d.total_products ?? 0 }}</p></div>
          <div class="card p-4"><p class="text-xs text-gray-500">إجمالي المبيعات</p><p class="text-2xl font-extrabold text-amber-700">{{ d.gross_revenue | number:'1.0-2' }}</p></div>
          <div class="card p-4"><p class="text-xs text-gray-500">صافي الأرباح ({{ 100 - (d.commission_rate ?? 0) }}%)</p><p class="text-2xl font-extrabold text-emerald-700">{{ d.net_earnings | number:'1.0-2' }}</p></div>
          <div class="card p-4"><p class="text-xs text-gray-500">عمولة المنصة</p><p class="text-2xl font-extrabold">{{ d.commission_rate ?? 0 }}%</p></div>
          <div class="card p-4"><p class="text-xs text-gray-500">التقييم العام</p><p class="text-2xl font-extrabold">⭐ {{ d.rating ?? 0 }}</p></div>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="card p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="font-extrabold">أحدث الطلبات</h2>
            <a routerLink="/seller/orders" class="text-xs text-amber-700 font-bold hover:underline">عرض الكل ←</a>
          </div>
          @for (o of recentOrders(); track o.id) {
            <div class="flex justify-between items-center text-sm py-2.5 border-b border-amber-50">
              <div>
                <span class="font-bold">#{{ o.order_number }}</span>
                <span class="text-xs text-gray-500 mr-2">{{ o.user?.name }}</span>
              </div>
              <span class="font-bold">{{ o.total | number:'1.0-2' }} <span class="badge bg-amber-100 text-amber-800 mr-1">{{ label(o.status) }}</span></span>
            </div>
          } @empty { <p class="text-sm text-gray-400 text-center py-4">لا توجد طلبات حديثة.</p> }
        </div>

        <div class="card p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="font-extrabold">⚠️ تنبيهات المخزون المنخفض</h2>
            <a routerLink="/seller/products" class="text-xs text-amber-700 font-bold hover:underline">إدارة المنتجات ←</a>
          </div>
          @for (p of lowStock(); track p.id) {
            <div class="flex justify-between items-center text-sm py-2.5 border-b border-amber-50">
              <div class="flex items-center gap-2.5">
                @if (p.image) { <img [src]="img(p.image)" class="w-8 h-8 rounded object-cover border" /> }
                <span class="font-bold">{{ p.name }}</span>
              </div>
              <span class="badge bg-rose-100 text-rose-700 font-bold">متبقي: {{ p.stock }}</span>
            </div>
          } @empty { <p class="text-sm text-emerald-700 text-center py-4">المخزون في حالة ممتازة ✔</p> }
        </div>
      </div>
    </div>
  `
})
export class SellerDashboardComponent implements OnInit {
  private readonly seller = inject(SellerService);
  readonly s = signal<any>(null);
  readonly recentOrders = signal<any[]>([]);
  readonly lowStock = signal<any[]>([]);
  img = resolveAdminImg;

  ngOnInit(): void {
    this.seller.getStatistics().subscribe({ next: (r) => this.s.set(r?.data || r) });
    this.seller.getOrders().subscribe({ next: (r) => this.recentOrders.set(((r?.data || r) || []).slice(0, 5)) });
    this.seller.getLowStock().subscribe({ next: (r) => this.lowStock.set((r?.data || r || []).slice(0, 6)) });
  }

  label(st: string) { return ORDER_STATUS_LABELS[st] || st; }
}
