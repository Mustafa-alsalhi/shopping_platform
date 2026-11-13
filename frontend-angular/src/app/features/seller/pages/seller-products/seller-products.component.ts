import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SellerService } from '../../../../core/services/seller.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-extrabold">المنتجات / الوجبات</h1>
          <p class="text-xs text-gray-500">إدارة منتجات متجرك، الأسعار، المخزون، والمتغيرات</p>
        </div>
        <a routerLink="/seller/products/new" class="btn btn-primary text-sm">+ إضافة منتج جديد</a>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="card p-3.5"><p class="text-xs text-gray-500">الإجمالي</p><p class="text-xl font-extrabold">{{ products().length }}</p></div>
        <div class="card p-3.5"><p class="text-xs text-gray-500">النشطة</p><p class="text-xl font-extrabold text-emerald-700">{{ activeCount() }}</p></div>
        <div class="card p-3.5"><p class="text-xs text-gray-500">مخزون منخفض</p><p class="text-xl font-extrabold text-rose-600">{{ lowStockCount() }}</p></div>
        <div class="card p-3.5"><p class="text-xs text-gray-500">المميزة</p><p class="text-xl font-extrabold text-amber-700">{{ featuredCount() }}</p></div>
      </div>

      <div class="card p-3 flex flex-wrap gap-3">
        <input class="input flex-1 min-w-[200px]" [(ngModel)]="search" (ngModelChange)="load()" placeholder="ابحث باسم المنتج أو SKU..." />
        <select class="input w-40" [(ngModel)]="status" (ngModelChange)="load()">
          <option value="">كل الحالات</option><option value="active">نشط</option><option value="inactive">غير نشط</option>
        </select>
      </div>

      <div class="card overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-amber-50 text-xs">
            <tr><th class="p-3 text-right">المنتج</th><th class="p-3">القسم</th><th class="p-3">السعر</th><th class="p-3">المخزون</th><th class="p-3">الحالة</th><th class="p-3">إجراءات</th></tr>
          </thead>
          <tbody>
            @for (p of products(); track p.id) {
              <tr class="border-t border-amber-100 hover:bg-amber-50/30">
                <td class="p-3">
                  <div class="flex items-center gap-3">
                    <img [src]="img(p.image)" class="w-12 h-12 rounded-lg object-cover bg-amber-50 border shrink-0" />
                    <div>
                      <p class="font-bold">{{ p.name }} @if (p.featured) { <span class="text-amber-500 text-xs">★</span> }</p>
                      <p class="text-xs text-gray-500">{{ p.sku || '—' }}</p>
                    </div>
                  </div>
                </td>
                <td class="p-3 text-center text-xs">{{ p.category?.name || p.seller_category?.name || '—' }}</td>
                <td class="p-3 text-center font-bold">
                  {{ p.price | number:'1.0-2' }}
                  @if (p.old_price && p.old_price > p.price) {
                    <span class="block text-xs text-gray-400 line-through">{{ p.old_price | number:'1.0-2' }}</span>
                  }
                </td>
                <td class="p-3 text-center">
                  <span class="badge" [class]="p.stock <= 5 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'">{{ p.stock }}</span>
                </td>
                <td class="p-3 text-center">
                  <span class="badge" [class]="p.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'">
                    {{ p.status === 'active' ? 'نشط' : 'غير نشط' }}
                  </span>
                </td>
                <td class="p-3 text-center space-x-2 space-x-reverse whitespace-nowrap">
                  <a [routerLink]="['/seller/products', p.id, 'edit']" class="text-blue-700 font-bold text-xs">تعديل</a>
                  <button (click)="remove(p.id)" class="text-rose-600 text-xs">حذف</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="p-8 text-center text-gray-500">لا توجد منتجات.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class SellerProductsComponent implements OnInit {
  private readonly seller = inject(SellerService);
  private readonly toast = inject(ToastService);
  readonly products = signal<any[]>([]);
  search = ''; status = '';
  img = resolveAdminImg;

  readonly activeCount = computed(() => this.products().filter(p => p.status === 'active').length);
  readonly lowStockCount = computed(() => this.products().filter(p => (p.stock ?? 0) <= 5).length);
  readonly featuredCount = computed(() => this.products().filter(p => !!p.featured).length);

  ngOnInit(): void { this.load(); }
  load() { this.seller.getProducts(this.search, this.status).subscribe({ next: (p) => this.products.set(p || []) }); }
  remove(id: number) {
    if (!confirm('هل أنت متأكد من حذف المنتج؟')) return;
    this.seller.deleteProduct(id).subscribe({ next: () => { this.toast.success('تم الحذف'); this.load(); } });
  }
}
