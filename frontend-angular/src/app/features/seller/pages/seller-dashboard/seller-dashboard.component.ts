import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
      <!-- Executive Header -->
      <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center text-lg">📊</span>
            <div>
              <h1 class="text-xl font-extrabold text-gray-900">لوحة تحكم وإحصائيات المتجر</h1>
              <p class="text-xs text-gray-500">متابعة المبيعات الزمنية، صافي الأرباح، أداء المنتجات، والطلبات الواردة</p>
            </div>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            (click)="loadAll()"
            [disabled]="loading()"
            class="btn btn-outline py-2 px-3.5 font-bold bg-white">
            {{ loading() ? 'جاري التحديث...' : '🔄 تحديث' }}
          </button>
          <button
            type="button"
            (click)="exportCsv()"
            class="btn bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3.5 font-bold shadow-sm">
            📥 تصدير تقرير CSV
          </button>
          <a routerLink="/seller/orders" class="btn btn-outline py-2 px-3.5 font-bold bg-white">📦 الطلبات</a>
          <a routerLink="/seller/products/new" class="btn btn-primary py-2 px-4 font-extrabold shadow-sm">+ منتج جديد</a>
        </div>
      </div>

      @if (loading() && !s()) {
        <div class="bg-white rounded-2xl border border-amber-100 p-12 text-center">
          <div class="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-sm text-gray-500 font-semibold">جاري تحميل إحصائيات المتجر...</p>
        </div>
      }

      @if (s(); as d) {
        <!-- Primary KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div class="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-amber-100">إجمالي المبيعات</span>
              <span class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">💰</span>
            </div>
            <p class="text-2xl sm:text-3xl font-extrabold mt-2">{{ (d.gross_revenue ?? d.total_sales ?? 0) | number:'1.0-2' }} <span class="text-xs font-semibold">ر.س</span></p>
            <p class="text-[11px] text-amber-100 mt-2">متوسط الطلب: {{ avgOrderValue() | number:'1.0-2' }} ر.س</p>
          </div>

          <div class="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-5 shadow-md">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-emerald-100">صافي الأرباح ({{ 100 - (d.commission_rate ?? 0) }}%)</span>
              <span class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">🏦</span>
            </div>
            <p class="text-2xl sm:text-3xl font-extrabold mt-2">{{ (d.net_earnings ?? d.gross_revenue ?? 0) | number:'1.0-2' }} <span class="text-xs font-semibold">ر.س</span></p>
            <p class="text-[11px] text-emerald-100 mt-2">عمولة المنصة: {{ d.commission_rate ?? 0 }}%</p>
          </div>

          <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-500">إجمالي الطلبات</span>
              <span class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">🛒</span>
            </div>
            <p class="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">{{ d.total_orders ?? 0 }}</p>
            <div class="flex items-center gap-2 mt-2 text-[11px]">
              <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">قيد المعالجة: {{ d.pending_orders ?? 0 }}</span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">مكتمل: {{ d.completed_orders ?? 0 }}</span>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold text-gray-500">المنتجات والتقييم</span>
              <span class="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">🛍️</span>
            </div>
            <div class="flex items-baseline justify-between mt-2">
              <p class="text-2xl sm:text-3xl font-extrabold text-gray-900">{{ d.total_products ?? 0 }} <span class="text-xs font-semibold text-gray-400">منتج</span></p>
              <span class="text-base font-extrabold text-amber-600">⭐ {{ d.rating ?? 0 }}</span>
            </div>
            <div class="flex items-center justify-between text-[11px] text-gray-500 mt-2">
              <span>تنبيهات المخزون: <strong class="text-rose-600">{{ lowStock().length }}</strong></span>
              <a routerLink="/seller/products" class="text-amber-700 font-bold hover:underline">إدارة ←</a>
            </div>
          </div>
        </div>

        <!-- Time-Based Sales Breakdown -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-1.5">
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>مبيعات اليوم</span>
              <span>☀️</span>
            </div>
            <p class="text-xl font-extrabold text-gray-900">{{ (d.today_sales ?? 0) | number:'1.0-2' }} <span class="text-[11px] text-gray-400">ر.س</span></p>
            <div class="w-full h-1.5 bg-amber-100 rounded-full overflow-hidden">
              <div class="h-full bg-amber-500 rounded-full" [style.width.%]="salesRatio(d.today_sales, d.this_month_sales)"></div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-1.5">
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>مبيعات هذا الأسبوع</span>
              <span>📅</span>
            </div>
            <p class="text-xl font-extrabold text-gray-900">{{ (d.this_week_sales ?? 0) | number:'1.0-2' }} <span class="text-[11px] text-gray-400">ر.س</span></p>
            <div class="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
              <div class="h-full bg-blue-500 rounded-full" [style.width.%]="salesRatio(d.this_week_sales, d.this_month_sales)"></div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-1.5">
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>مبيعات هذا الشهر</span>
              <span>📆</span>
            </div>
            <p class="text-xl font-extrabold text-gray-900">{{ (d.this_month_sales ?? 0) | number:'1.0-2' }} <span class="text-[11px] text-gray-400">ر.س</span></p>
            <div class="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 rounded-full" [style.width.%]="salesRatio(d.this_month_sales, d.this_year_sales)"></div>
            </div>
          </div>

          <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-1.5">
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>مبيعات هذا العام</span>
              <span>📈</span>
            </div>
            <p class="text-xl font-extrabold text-gray-900">{{ (d.this_year_sales ?? d.gross_revenue ?? 0) | number:'1.0-2' }} <span class="text-[11px] text-gray-400">ر.س</span></p>
            <div class="w-full h-1.5 bg-purple-100 rounded-full overflow-hidden">
              <div class="h-full bg-purple-500 rounded-full w-full"></div>
            </div>
          </div>
        </div>
      }

      <!-- Sales Trend Chart + Top Products -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="lg:col-span-2 bg-white rounded-2xl border border-amber-100 shadow-sm p-5 space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="font-extrabold text-gray-900">📈 منحنى أداء المبيعات</h2>
              <p class="text-xs text-gray-500">تطور المبيعات خلال الفترة المحددة</p>
            </div>
            <div class="flex items-center gap-1 bg-amber-50 p-1 rounded-xl border border-amber-100 text-xs">
              <button
                type="button"
                (click)="changePeriod('daily')"
                [class]="period() === 'daily' ? 'bg-amber-600 text-white font-bold shadow-sm' : 'text-gray-600 hover:text-amber-800'"
                class="px-3 py-1.5 rounded-lg transition">
                يومي
              </button>
              <button
                type="button"
                (click)="changePeriod('weekly')"
                [class]="period() === 'weekly' ? 'bg-amber-600 text-white font-bold shadow-sm' : 'text-gray-600 hover:text-amber-800'"
                class="px-3 py-1.5 rounded-lg transition">
                أسبوعي
              </button>
              <button
                type="button"
                (click)="changePeriod('monthly')"
                [class]="period() === 'monthly' ? 'bg-amber-600 text-white font-bold shadow-sm' : 'text-gray-600 hover:text-amber-800'"
                class="px-3 py-1.5 rounded-lg transition">
                شهري
              </button>
            </div>
          </div>

          @if (salesTrends().length > 0) {
            <div class="h-56 w-full relative">
              <svg viewBox="0 0 600 200" preserveAspectRatio="none" class="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.35" />
                    <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.0" />
                  </linearGradient>
                </defs>
                <!-- Grid lines -->
                <line x1="0" y1="30" x2="600" y2="30" stroke="#fef3c7" stroke-width="1" />
                <line x1="0" y1="85" x2="600" y2="85" stroke="#fef3c7" stroke-width="1" />
                <line x1="0" y1="140" x2="600" y2="140" stroke="#fef3c7" stroke-width="1" />
                <line x1="0" y1="185" x2="600" y2="185" stroke="#fde68a" stroke-width="1" />
                <!-- Area -->
                <polygon [attr.points]="chartAreaPoints()" fill="url(#salesGrad)" />
                <!-- Line -->
                <polyline fill="none" stroke="#d97706" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" [attr.points]="chartLinePoints()" />
                <!-- Dots -->
                @for (pt of chartPoints(); track $index) {
                  <circle [attr.cx]="pt.x" [attr.cy]="pt.y" r="4.5" fill="#ffffff" stroke="#d97706" stroke-width="2.5">
                    <title>{{ pt.label }}: {{ pt.value | number:'1.0-2' }} ر.س</title>
                  </circle>
                }
              </svg>
            </div>
            <div class="flex items-center justify-between text-[11px] text-gray-500 pt-1 border-t border-amber-50 overflow-x-auto gap-2">
              @for (pt of chartPoints().slice(-7); track $index) {
                <div class="text-center shrink-0">
                  <div class="font-bold text-gray-800">{{ pt.value | number:'1.0-0' }}</div>
                  <div class="text-[10px] text-gray-400">{{ pt.label }}</div>
                </div>
              }
            </div>
          } @else {
            <div class="h-48 flex flex-col items-center justify-center text-gray-400 text-sm bg-amber-50/30 rounded-xl border border-dashed border-amber-200">
              <span class="text-2xl mb-1">📉</span>
              <p>لا توجد بيانات مبيعات كافية لعرض المنحنى في هذه الفترة.</p>
            </div>
          }
        </div>

        <!-- Top Products -->
        <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="font-extrabold text-gray-900">🏆 الأكثر مبيعاً</h2>
            <a routerLink="/seller/reports" class="text-xs text-amber-700 font-bold hover:underline">التقارير ←</a>
          </div>
          <div class="space-y-2.5">
            @for (p of topProducts(); track p.id || $index) {
              <div class="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-amber-50/40 transition border border-transparent hover:border-amber-100">
                <div class="flex items-center gap-2.5 min-w-0">
                  <span class="w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs font-extrabold flex items-center justify-center shrink-0">{{ $index + 1 }}</span>
                  @if (p.image) { <img [src]="img(p.image)" class="w-9 h-9 rounded-lg object-cover border shrink-0" /> }
                  <span class="font-bold text-sm text-gray-800 truncate">{{ p.name }}</span>
                </div>
                <span class="badge bg-amber-100 text-amber-800 font-bold shrink-0">{{ p.total_sold ?? p.sales_count ?? 0 }} مبيعة</span>
              </div>
            } @empty {
              <p class="text-sm text-gray-400 text-center py-8">لا توجد بيانات مبيعات بعد.</p>
            }
          </div>
        </div>
      </div>

      <!-- Recent Orders & Low Stock Alerts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="font-extrabold text-gray-900">🧾 أحدث الطلبات الواردة</h2>
            <a routerLink="/seller/orders" class="text-xs text-amber-700 font-bold hover:underline">عرض الكل ←</a>
          </div>
          <div class="divide-y divide-amber-50">
            @for (o of recentOrders(); track o.id) {
              <div class="flex justify-between items-center text-sm py-3 gap-2">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-extrabold text-gray-900">#{{ o.order_number }}</span>
                    <span class="text-xs text-gray-500 truncate">{{ o.user?.name || (o.user?.first_name + ' ' + (o.user?.last_name || '')) }}</span>
                  </div>
                  <p class="text-[11px] text-gray-400 mt-0.5">{{ o.created_at | date:'short' }}</p>
                </div>
                <div class="text-left shrink-0">
                  <p class="font-extrabold text-gray-900">{{ (o.total_amount ?? o.total ?? 0) | number:'1.0-2' }} ر.س</p>
                  <span class="badge text-[11px] font-bold mt-0.5" [ngClass]="statusClass(o.status)">{{ label(o.status) }}</span>
                </div>
              </div>
            } @empty {
              <p class="text-sm text-gray-400 text-center py-6">لا توجد طلبات حديثة.</p>
            }
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="font-extrabold text-gray-900">⚠️ تنبيهات المخزون المنخفض</h2>
            <a routerLink="/seller/products" class="text-xs text-amber-700 font-bold hover:underline">إدارة المنتجات ←</a>
          </div>
          <div class="divide-y divide-amber-50">
            @for (p of lowStock(); track p.id) {
              <div class="flex justify-between items-center text-sm py-2.5 gap-2">
                <div class="flex items-center gap-2.5 min-w-0">
                  @if (p.image) { <img [src]="img(p.image)" class="w-9 h-9 rounded-lg object-cover border shrink-0" /> }
                  <span class="font-bold text-gray-800 truncate">{{ p.name }}</span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="badge bg-rose-100 text-rose-700 font-bold">متبقي: {{ p.stock }}</span>
                  <a [routerLink]="['/seller/products', p.id, 'edit']" class="text-xs text-amber-700 font-bold hover:underline">تحديث</a>
                </div>
              </div>
            } @empty {
              <p class="text-sm text-emerald-700 text-center py-6 font-semibold">المخزون في حالة ممتازة ✔</p>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class SellerDashboardComponent implements OnInit {
  private readonly seller = inject(SellerService);

  readonly loading = signal(false);
  readonly period = signal<'daily' | 'weekly' | 'monthly'>('daily');
  readonly s = signal<any>(null);
  readonly salesTrends = signal<any[]>([]);
  readonly topProducts = signal<any[]>([]);
  readonly recentOrders = signal<any[]>([]);
  readonly lowStock = signal<any[]>([]);
  img = resolveAdminImg;

  readonly avgOrderValue = computed(() => {
    const d = this.s();
    if (!d || !d.total_orders) return 0;
    const rev = Number(d.gross_revenue ?? d.total_sales ?? 0);
    return rev / Number(d.total_orders);
  });

  readonly chartPoints = computed(() => {
    const data = this.salesTrends();
    if (!data || data.length === 0) return [];
    const values = data.map((d) => Number(d.total ?? d.revenue ?? d.amount ?? 0));
    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;
    const w = 580;
    const h = 150;
    return data.map((d, i) => {
      const x = data.length === 1 ? 300 : 10 + (i / (data.length - 1)) * w;
      const val = values[i];
      const y = 175 - ((val - minVal) / range) * h;
      const rawDate = d.date || d.period || d.label || '';
      return { x: Math.round(x), y: Math.round(y), value: val, label: rawDate };
    });
  });

  readonly chartLinePoints = computed(() =>
    this.chartPoints().map((p) => `${p.x},${p.y}`).join(' ')
  );

  readonly chartAreaPoints = computed(() => {
    const pts = this.chartPoints();
    if (pts.length === 0) return '';
    return `${pts[0].x},185 ${pts.map((p) => `${p.x},${p.y}`).join(' ')} ${pts[pts.length - 1].x},185`;
  });

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.loading.set(true);
    this.seller.getStatistics().subscribe({
      next: (r) => {
        this.s.set(r?.data || r);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
    this.seller.getSalesTrends(this.period()).subscribe({
      next: (r) => this.salesTrends.set(Array.isArray(r) ? r : r?.data || []),
      error: () => {}
    });
    this.seller.getTopProducts().subscribe({
      next: (r) => this.topProducts.set((Array.isArray(r) ? r : r?.data || []).slice(0, 6)),
      error: () => {}
    });
    this.seller.getOrders().subscribe({
      next: (r) => this.recentOrders.set(((r?.data || r) || []).slice(0, 6)),
      error: () => {}
    });
    this.seller.getLowStock().subscribe({
      next: (r) => this.lowStock.set((Array.isArray(r) ? r : r?.data || []).slice(0, 6)),
      error: () => {}
    });
  }

  changePeriod(p: 'daily' | 'weekly' | 'monthly'): void {
    this.period.set(p);
    this.seller.getSalesTrends(p).subscribe({
      next: (r) => this.salesTrends.set(Array.isArray(r) ? r : r?.data || []),
      error: () => {}
    });
  }

  salesRatio(part: any, whole: any): number {
    const p = Number(part ?? 0);
    const w = Number(whole ?? 0);
    if (w <= 0) return p > 0 ? 100 : 0;
    return Math.min(100, Math.round((p / w) * 100));
  }

  label(st: string): string {
    return ORDER_STATUS_LABELS[st] || st;
  }

  statusClass(st: string): string {
    switch (st) {
      case 'delivered':
      case 'completed':
        return 'bg-emerald-100 text-emerald-800';
      case 'processing':
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800';
      default:
        return 'bg-amber-100 text-amber-800';
    }
  }

  exportCsv(): void {
    const d = this.s() || {};
    const BOM = '\uFEFF';
    let csv = BOM + 'تقرير أداء المتجر\n\n';
    csv += '--- الإحصائيات العامة ---\n';
    csv += `إجمالي المنتجات,${d.total_products ?? 0}\n`;
    csv += `إجمالي الطلبات,${d.total_orders ?? 0}\n`;
    csv += `الطلبات قيد المعالجة,${d.pending_orders ?? 0}\n`;
    csv += `الطلبات المكتملة,${d.completed_orders ?? 0}\n`;
    csv += `إجمالي المبيعات,${Number(d.gross_revenue ?? d.total_sales ?? 0).toFixed(2)}\n`;
    csv += `صافي الأرباح,${Number(d.net_earnings ?? 0).toFixed(2)}\n\n`;
    csv += '--- المبيعات الزمنية ---\n';
    csv += `مبيعات اليوم,${Number(d.today_sales ?? 0).toFixed(2)}\n`;
    csv += `مبيعات الأسبوع,${Number(d.this_week_sales ?? 0).toFixed(2)}\n`;
    csv += `مبيعات الشهر,${Number(d.this_month_sales ?? 0).toFixed(2)}\n`;
    csv += `مبيعات العام,${Number(d.this_year_sales ?? 0).toFixed(2)}\n\n`;
    csv += '--- أحدث الطلبات ---\n';
    csv += 'رقم الطلب,العميل,التاريخ,الحالة,الإجمالي\n';
    for (const o of this.recentOrders()) {
      const cname = o.user?.name || `${o.user?.first_name || ''} ${o.user?.last_name || ''}`.trim();
      csv += `#${o.order_number},"${cname}",${o.created_at || ''},${this.label(o.status)},${Number(o.total_amount ?? o.total ?? 0).toFixed(2)}\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير_متجري_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
