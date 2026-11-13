import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SellerService } from '../../../../core/services/seller.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-seller-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-xl font-extrabold">التقارير والأرباح</h1>
        <p class="text-xs text-gray-500">تحليل المبيعات، الأرباح الصافية، والمنتجات الأكثر مبيعاً</p>
      </div>

      @if (kpis(); as k) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="card p-4"><p class="text-xs text-gray-500">إجمالي المبيعات</p><p class="text-2xl font-extrabold text-amber-700">{{ k.total_revenue ?? 0 | number:'1.0-2' }}</p></div>
          <div class="card p-4"><p class="text-xs text-gray-500">صافي الأرباح</p><p class="text-2xl font-extrabold text-emerald-700">{{ k.net_earnings ?? 0 | number:'1.0-2' }}</p></div>
          <div class="card p-4"><p class="text-xs text-gray-500">إجمالي الطلبات</p><p class="text-2xl font-extrabold">{{ k.total_orders ?? 0 }}</p></div>
          <div class="card p-4"><p class="text-xs text-gray-500">متوسط قيمة الطلب</p><p class="text-2xl font-extrabold">{{ k.average_order_value ?? 0 | number:'1.0-2' }}</p></div>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="card p-5 space-y-3">
          <h2 class="font-extrabold">🏆 المنتجات الأكثر مبيعاً</h2>
          @for (p of topProducts(); track p.id || $index) {
            <div class="flex items-center justify-between text-sm py-2 border-b border-amber-50">
              <div class="flex items-center gap-2.5">
                @if (p.image) { <img [src]="img(p.image)" class="w-9 h-9 rounded object-cover border" /> }
                <span class="font-bold">{{ p.name }}</span>
              </div>
              <span class="badge bg-amber-100 text-amber-800">{{ p.total_sold ?? p.sales_count ?? 0 }} مبيعة</span>
            </div>
          } @empty { <p class="text-sm text-gray-400 text-center py-4">لا توجد بيانات مبيعات كافية.</p> }
        </div>

        <div class="card p-5 space-y-3">
          <h2 class="font-extrabold">⚠️ منتجات قاربت على النفاد</h2>
          @for (p of lowStock(); track p.id) {
            <div class="flex items-center justify-between text-sm py-2 border-b border-amber-50">
              <span class="font-bold">{{ p.name }}</span>
              <span class="badge bg-rose-100 text-rose-700">المخزون: {{ p.stock }}</span>
            </div>
          } @empty { <p class="text-sm text-emerald-700 text-center py-4">المخزون متوفر ✔</p> }
        </div>
      </div>
    </div>
  `
})
export class SellerReportsComponent implements OnInit {
  private readonly seller = inject(SellerService);
  readonly kpis = signal<any>(null);
  readonly topProducts = signal<any[]>([]);
  readonly lowStock = signal<any[]>([]);
  img = resolveAdminImg;

  ngOnInit(): void {
    this.seller.getKpis().subscribe({ next: (r) => this.kpis.set(r?.data || r) });
    this.seller.getTopProducts().subscribe({ next: (r) => this.topProducts.set(r?.data || r || []) });
    this.seller.getLowStock().subscribe({ next: (r) => this.lowStock.set(r?.data || r || []) });
  }
}
