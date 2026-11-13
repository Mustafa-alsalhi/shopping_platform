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
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-extrabold">لوحة الإحصائيات العامة</h1>
          <p class="text-xs text-gray-500">نظرة شاملة على أداء المتجر، الطلبات، المبيعات، والمخزون</p>
        </div>
        <div class="flex flex-wrap gap-2 text-xs">
          <a routerLink="/admin/orders" class="btn btn-outline py-1.5 px-3">الطلبات</a>
          <a routerLink="/admin/products" class="btn btn-primary py-1.5 px-3">+ المنتجات</a>
          <a routerLink="/admin/sellers" class="btn btn-outline py-1.5 px-3">البائعون</a>
          <a routerLink="/admin/settings" class="btn btn-outline py-1.5 px-3">الإعدادات</a>
        </div>
      </div>

      @if (d(); as s) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          @for (c of cards(s); track c.label) {
            <div class="card p-4 flex flex-col justify-between">
              <p class="text-xs text-gray-500 font-bold">{{ c.label }}</p>
              <p class="text-2xl font-extrabold mt-1" [class]="c.color">{{ c.value | number:'1.0-2' }}</p>
            </div>
          }
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div class="card p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="font-extrabold">أحدث الطلبات</h2>
              <a routerLink="/admin/orders" class="text-xs text-amber-700 font-bold hover:underline">عرض الكل ←</a>
            </div>
            @for (o of s.recent_orders; track o.id) {
              <div class="flex justify-between items-center text-sm py-2.5 border-b border-amber-50">
                <div>
                  <span class="font-bold">#{{ o.order_number }}</span>
                  <span class="text-gray-500 text-xs mr-2">{{ o.user?.name }}</span>
                </div>
                <span class="font-bold">{{ o.total | number:'1.0-2' }} <span class="badge bg-amber-100 text-amber-800 mr-1">{{ label(o.status) }}</span></span>
              </div>
            } @empty { <p class="text-sm text-gray-400 text-center py-4">لا توجد طلبات حديثة.</p> }
          </div>

          <div class="card p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="font-extrabold">⚠️ منتجات منخفضة المخزون</h2>
              <a routerLink="/admin/products" class="text-xs text-amber-700 font-bold hover:underline">إدارة المنتجات ←</a>
            </div>
            @for (p of s.low_stock_products; track p.id) {
              <div class="flex justify-between items-center text-sm py-2.5 border-b border-amber-50">
                <span class="font-bold">{{ p.name }}</span>
                <span class="badge bg-rose-100 text-rose-700 font-bold">متبقي: {{ p.stock }}</span>
              </div>
            } @empty { <p class="text-sm text-emerald-700 text-center py-4">المخزون في حالة ممتازة ✔</p> }
          </div>
        </div>
      }
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private readonly admin = inject(AdminService);
  readonly d = signal<any>(null);
  ngOnInit(): void { this.admin.getDashboard().subscribe({ next: (r) => this.d.set(r) }); }
  label(s: string) { return ORDER_STATUS_LABELS[s] || s; }
  cards(s: any) {
    return [
      { label: 'المستخدمون', value: s.total_users, color: 'text-slate-800' },
      { label: 'البائعون والمتاجر', value: s.total_sellers, color: 'text-slate-800' },
      { label: 'المندوبون', value: s.total_drivers, color: 'text-slate-800' },
      { label: 'المنتجات', value: s.total_products, color: 'text-slate-800' },
      { label: 'إجمالي الطلبات', value: s.total_orders, color: 'text-slate-800' },
      { label: 'إجمالي الإيرادات', value: s.total_revenue, color: 'text-amber-700' },
      { label: 'طلبات قيد الانتظار', value: s.pending_orders, color: 'text-blue-700' },
      { label: 'طلبات مكتملة', value: s.completed_orders, color: 'text-emerald-700' }
    ];
  }
}
