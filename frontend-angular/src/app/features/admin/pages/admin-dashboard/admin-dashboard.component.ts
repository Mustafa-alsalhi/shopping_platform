import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { ORDER_STATUS_LABELS } from '../../../../shared/constants/order-status';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <!-- Executive Header -->
      <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl">📊</span>
          <div>
            <h1 class="text-xl font-extrabold text-gray-900">لوحة الإحصائيات والقيادة العامة</h1>
            <p class="text-xs text-gray-500">نظرة شاملة على التدفقات النقدية، أداء البائعين، حالة الطلبات، والمخزون</p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            (click)="load()"
            [disabled]="loading()"
            class="btn btn-outline py-2 px-3.5 font-bold bg-white">
            {{ loading() ? 'جاري التحديث...' : '🔄 تحديث' }}
          </button>
          <button
            type="button"
            (click)="exportCsv()"
            class="btn bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3.5 font-bold shadow-sm">
            📥 تصدير تقرير الإدارة CSV
          </button>
          <a routerLink="/admin/orders" class="btn btn-outline py-2 px-3.5 font-bold bg-white">📦 الطلبات</a>
          <a routerLink="/admin/products" class="btn btn-primary py-2 px-4 font-extrabold shadow-sm">+ المنتجات</a>
        </div>
      </div>

      @if (loading() && !d()) {
        <div class="bg-white rounded-2xl border border-amber-100 p-12 text-center">
          <div class="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-sm text-gray-500 font-semibold">جاري تحميل إحصائيات المنصة...</p>
        </div>
      }

      @if (d(); as s) {
        <!-- Primary Hero KPIs -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div class="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-amber-100">إجمالي الإيرادات</span>
              <span class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">💰</span>
            </div>
            <p class="text-2xl sm:text-3xl font-extrabold mt-2">{{ (s.total_revenue ?? 0) | number:'1.0-2' }} <span class="text-xs font-semibold">ر.س</span></p>
            <p class="text-[11px] text-amber-100 mt-2">متوسط قيمة الطلب: {{ avgOrderValue() | number:'1.0-2' }} ر.س</p>
          </div>

          <div class="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white p-5 shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-slate-300">إجمالي الطلبات</span>
              <span class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">📦</span>
            </div>
            <p class="text-2xl sm:text-3xl font-extrabold mt-2">{{ s.total_orders ?? 0 }}</p>
            <div class="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
              <span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">معلق: {{ s.pending_orders ?? 0 }}</span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">مكتمل: {{ s.completed_orders ?? 0 }}</span>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-500">الشركاء والتوصيل</span>
              <span class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">🤝</span>
            </div>
            <div class="flex items-baseline justify-between mt-2">
              <p class="text-2xl font-extrabold text-gray-900">{{ s.total_sellers ?? 0 }} <span class="text-xs font-semibold text-gray-400">متجر/مطعم</span></p>
              <span class="text-sm font-extrabold text-blue-700">{{ s.total_drivers ?? 0 }} مندوب</span>
            </div>
            <div class="flex items-center justify-between text-[11px] text-gray-500 mt-2">
              <a routerLink="/admin/sellers" class="text-amber-700 font-bold hover:underline">إدارة البائعين ←</a>
              <a routerLink="/admin/drivers" class="text-blue-700 font-bold hover:underline">المندوبين ←</a>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-500">المستخدمون والمنتجات</span>
              <span class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">👥</span>
            </div>
            <div class="flex items-baseline justify-between mt-2">
              <p class="text-2xl font-extrabold text-gray-900">{{ s.total_users ?? 0 }} <span class="text-xs font-semibold text-gray-400">مستخدم</span></p>
              <span class="text-sm font-extrabold text-purple-700">{{ s.total_products ?? 0 }} منتج</span>
            </div>
            <div class="flex items-center justify-between text-[11px] text-gray-500 mt-2">
              <span>نقص مخزون: <strong class="text-rose-600">{{ (s.low_stock_products || []).length }}</strong></span>
              <a routerLink="/admin/users" class="text-amber-700 font-bold hover:underline">المستخدمون ←</a>
            </div>
          </div>
        </div>

        <!-- Cashflow & Order Velocity (Time-based) -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-1">
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>مبيعات اليوم</span>
              <span class="badge bg-amber-50 text-amber-800 font-bold">{{ s.today_orders ?? 0 }} طلب</span>
            </div>
            <p class="text-xl font-extrabold text-gray-900">{{ (s.today_revenue ?? 0) | number:'1.0-2' }} <span class="text-[11px] text-gray-400">ر.س</span></p>
          </div>

          <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-1">
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>مبيعات الأسبوع</span>
              <span class="badge bg-blue-50 text-blue-800 font-bold">{{ s.this_week_orders ?? 0 }} طلب</span>
            </div>
            <p class="text-xl font-extrabold text-gray-900">{{ (s.this_week_revenue ?? 0) | number:'1.0-2' }} <span class="text-[11px] text-gray-400">ر.س</span></p>
          </div>

          <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-1">
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>مبيعات الشهر</span>
              <span class="badge bg-emerald-50 text-emerald-800 font-bold">{{ s.this_month_orders ?? 0 }} طلب</span>
            </div>
            <p class="text-xl font-extrabold text-gray-900">{{ (s.this_month_revenue ?? 0) | number:'1.0-2' }} <span class="text-[11px] text-gray-400">ر.س</span></p>
          </div>

          <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-1">
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>مبيعات العام</span>
              <span class="badge bg-purple-50 text-purple-800 font-bold">{{ s.this_year_orders ?? 0 }} طلب</span>
            </div>
            <p class="text-xl font-extrabold text-gray-900">{{ (s.this_year_revenue ?? s.total_revenue ?? 0) | number:'1.0-2' }} <span class="text-[11px] text-gray-400">ر.س</span></p>
          </div>
        </div>

        <!-- Order Status Distribution + Top Selling Products -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 space-y-4">
            <h2 class="font-extrabold text-gray-900">📊 توزيع حالات الطلبات</h2>
            <div class="space-y-3 text-xs">
              <div>
                <div class="flex justify-between font-bold mb-1">
                  <span class="text-amber-800">قيد الانتظار</span>
                  <span>{{ s.pending_orders ?? 0 }} ({{ pct(s.pending_orders, s.total_orders) }}%)</span>
                </div>
                <div class="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
                  <div class="h-full bg-amber-500 rounded-full" [style.width.%]="pct(s.pending_orders, s.total_orders)"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between font-bold mb-1">
                  <span class="text-blue-800">قيد التجهيز والشحن</span>
                  <span>{{ s.processing_orders ?? 0 }} ({{ pct(s.processing_orders, s.total_orders) }}%)</span>
                </div>
                <div class="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                  <div class="h-full bg-blue-500 rounded-full" [style.width.%]="pct(s.processing_orders, s.total_orders)"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between font-bold mb-1">
                  <span class="text-emerald-800">مكتملة التسليم</span>
                  <span>{{ s.completed_orders ?? 0 }} ({{ pct(s.completed_orders, s.total_orders) }}%)</span>
                </div>
                <div class="w-full h-2 bg-emerald-100 rounded-full overflow-hidden">
                  <div class="h-full bg-emerald-500 rounded-full" [style.width.%]="pct(s.completed_orders, s.total_orders)"></div>
                </div>
              </div>
              <div>
                <div class="flex justify-between font-bold mb-1">
                  <span class="text-rose-800">ملغاة</span>
                  <span>{{ s.cancelled_orders ?? 0 }} ({{ pct(s.cancelled_orders, s.total_orders) }}%)</span>
                </div>
                <div class="w-full h-2 bg-rose-100 rounded-full overflow-hidden">
                  <div class="h-full bg-rose-500 rounded-full" [style.width.%]="pct(s.cancelled_orders, s.total_orders)"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="lg:col-span-2 bg-white rounded-2xl border border-amber-100 shadow-sm p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="font-extrabold text-gray-900">🏆 المنتجات الأكثر مبيعاً في المنصة</h2>
              <a routerLink="/admin/products" class="text-xs text-amber-700 font-bold hover:underline">كل المنتجات ←</a>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              @for (p of s.top_selling_products || []; track p.id) {
                <div class="flex items-center justify-between gap-3 p-3 rounded-xl border border-amber-100/80 bg-amber-50/20">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold flex items-center justify-center shrink-0">{{ $index + 1 }}</span>
                    @if (p.image) { <img [src]="img(p.image)" class="w-9 h-9 rounded-lg object-cover border shrink-0" /> }
                    <div class="min-w-0">
                      <p class="font-bold text-sm text-gray-900 truncate">{{ p.name }}</p>
                      <p class="text-[11px] text-gray-500 truncate">{{ p.seller_name }}</p>
                    </div>
                  </div>
                  <div class="text-left shrink-0">
                    <span class="badge bg-amber-100 text-amber-800 font-bold">{{ p.sales }} مبيعة</span>
                    <p class="text-[11px] font-extrabold text-emerald-700 mt-0.5">{{ p.revenue | number:'1.0-2' }} ر.س</p>
                  </div>
                </div>
              } @empty {
                <p class="sm:col-span-2 text-sm text-gray-400 text-center py-6">لا توجد مبيعات مسجلة بعد.</p>
              }
            </div>
          </div>
        </div>

        <!-- Sellers Performance Table -->
        <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="font-extrabold text-gray-900">🏪 أداء البائعين والمتاجر</h2>
            <a routerLink="/admin/sellers" class="text-xs text-amber-700 font-bold hover:underline">إدارة البائعين ←</a>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-right">
              <thead>
                <tr class="border-b border-amber-100 text-xs text-gray-500">
                  <th class="py-2.5 px-3">المتجر / المطعم</th>
                  <th class="py-2.5 px-3">الطلبات</th>
                  <th class="py-2.5 px-3">المكتملة</th>
                  <th class="py-2.5 px-3">اليوم</th>
                  <th class="py-2.5 px-3">الأسبوع</th>
                  <th class="py-2.5 px-3">الشهر</th>
                  <th class="py-2.5 px-3">الإجمالي</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-amber-50">
                @for (sp of s.sellers_performance || []; track sp.id) {
                  <tr class="hover:bg-amber-50/30">
                    <td class="py-2.5 px-3 font-bold text-gray-900">{{ sp.store_name }}</td>
                    <td class="py-2.5 px-3">{{ sp.total_orders }}</td>
                    <td class="py-2.5 px-3 text-emerald-700 font-bold">{{ sp.completed_orders }}</td>
                    <td class="py-2.5 px-3">{{ sp.today_sales | number:'1.0-2' }}</td>
                    <td class="py-2.5 px-3">{{ sp.week_sales | number:'1.0-2' }}</td>
                    <td class="py-2.5 px-3">{{ sp.month_sales | number:'1.0-2' }}</td>
                    <td class="py-2.5 px-3 font-extrabold text-amber-700">{{ sp.total_sales | number:'1.0-2' }} ر.س</td>
                  </tr>
                } @empty {
                  <tr><td colspan="7" class="py-6 text-center text-gray-400">لا توجد بيانات أداء للبائعين بعد.</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Orders & Low Stock -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="font-extrabold text-gray-900">🧾 أحدث الطلبات</h2>
              <a routerLink="/admin/orders" class="text-xs text-amber-700 font-bold hover:underline">عرض الكل ←</a>
            </div>
            <div class="divide-y divide-amber-50">
              @for (o of s.recent_orders || []; track o.id) {
                <div class="flex justify-between items-center text-sm py-2.5 gap-2">
                  <div class="min-w-0">
                    <span class="font-extrabold text-gray-900">#{{ o.order_number }}</span>
                    <span class="text-gray-500 text-xs mr-2">{{ o.user?.name }}</span>
                    <p class="text-[11px] text-gray-400">{{ o.created_at | date:'short' }}</p>
                  </div>
                  <div class="text-left shrink-0">
                    <p class="font-extrabold">{{ (o.total_amount ?? o.total ?? 0) | number:'1.0-2' }} ر.س</p>
                    <span class="badge bg-amber-100 text-amber-800 text-[11px] font-bold">{{ label(o.status) }}</span>
                  </div>
                </div>
              } @empty { <p class="text-sm text-gray-400 text-center py-6">لا توجد طلبات حديثة.</p> }
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 space-y-3">
            <div class="flex items-center justify-between">
              <h2 class="font-extrabold text-gray-900">⚠️ منتجات منخفضة المخزون</h2>
              <a routerLink="/admin/products" class="text-xs text-amber-700 font-bold hover:underline">إدارة المنتجات ←</a>
            </div>
            <div class="divide-y divide-amber-50">
              @for (p of s.low_stock_products || []; track p.id) {
                <div class="flex justify-between items-center text-sm py-2.5 gap-2">
                  <div class="min-w-0">
                    <p class="font-bold text-gray-900 truncate">{{ p.name }}</p>
                    @if (p.seller?.store_name || p.seller?.name) {
                      <p class="text-[11px] text-gray-400">{{ p.seller?.store_name || p.seller?.name }}</p>
                    }
                  </div>
                  <span class="badge bg-rose-100 text-rose-700 font-bold shrink-0">متبقي: {{ p.stock }}</span>
                </div>
              } @empty { <p class="text-sm text-emerald-700 text-center py-6 font-semibold">المخزون في حالة ممتازة ✔</p> }
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminDashboardComponent implements OnInit {
  private readonly admin = inject(AdminService);
  readonly loading = signal(false);
  readonly d = signal<any>(null);
  img = resolveAdminImg;

  readonly avgOrderValue = computed(() => {
    const s = this.d();
    if (!s || !s.total_orders) return 0;
    return Number(s.total_revenue ?? 0) / Number(s.total_orders);
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.admin.getDashboard().subscribe({
      next: (r) => {
        this.d.set(r?.data || r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  pct(part: any, total: any): number {
    const p = Number(part ?? 0);
    const t = Number(total ?? 0);
    if (t <= 0) return 0;
    return Math.min(100, Math.round((p / t) * 100));
  }

  label(s: string) {
    return ORDER_STATUS_LABELS[s] || s;
  }

  exportCsv(): void {
    const s = this.d() || {};
    const BOM = '\uFEFF';
    let csv = BOM + 'تقرير لوحة تحكم الإدارة الشامل\n\n';
    csv += '--- الإحصائيات العامة ---\n';
    csv += `إجمالي المستخدمين,${s.total_users ?? 0}\n`;
    csv += `المتاجر / البائعين,${s.total_sellers ?? 0}\n`;
    csv += `المندوبين,${s.total_drivers ?? 0}\n`;
    csv += `المنتجات,${s.total_products ?? 0}\n`;
    csv += `إجمالي الطلبات,${s.total_orders ?? 0}\n`;
    csv += `الطلبات المعلقة,${s.pending_orders ?? 0}\n`;
    csv += `إجمالي الإيرادات,${Number(s.total_revenue ?? 0).toFixed(2)}\n\n`;

    csv += '--- التدفقات النقدية ---\n';
    csv += 'الفترة,الطلبات,المبيعات (ر.س)\n';
    csv += `اليوم,${s.today_orders ?? 0},${Number(s.today_revenue ?? 0).toFixed(2)}\n`;
    csv += `هذا الأسبوع,${s.this_week_orders ?? 0},${Number(s.this_week_revenue ?? 0).toFixed(2)}\n`;
    csv += `هذا الشهر,${s.this_month_orders ?? 0},${Number(s.this_month_revenue ?? 0).toFixed(2)}\n`;
    csv += `هذا العام,${s.this_year_orders ?? 0},${Number(s.this_year_revenue ?? 0).toFixed(2)}\n\n`;

    csv += '--- أداء البائعين ---\n';
    csv += 'المتجر,الطلبات,المكتملة,اليوم,الأسبوع,الشهر,الإجمالي\n';
    for (const sp of s.sellers_performance || []) {
      csv += `"${sp.store_name}",${sp.total_orders},${sp.completed_orders},${sp.today_sales},${sp.week_sales},${sp.month_sales},${sp.total_sales}\n`;
    }
    csv += '\n--- المنتجات الأكثر مبيعاً ---\n';
    csv += 'المنتج,المتجر,الكمية المباعة,الإيرادات\n';
    for (const p of s.top_selling_products || []) {
      csv += `"${p.name}","${p.seller_name}",${p.sales},${p.revenue}\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير_الادارة_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
