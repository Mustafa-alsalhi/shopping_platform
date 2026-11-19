import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';
import { AdminProductModalComponent } from '../../components/modals/admin-product-modal.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminProductModalComponent],
  template: `
    <div class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-extrabold">إدارة المنتجات</h1>
          <p class="text-xs text-gray-500">إضافة وتعديل المنتجات، المتغيرات، خيارات المطاعم، والصور</p>
        </div>
        <button (click)="openForm(null)" class="btn btn-primary text-sm">+ إضافة منتج جديد</button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="card p-3.5"><p class="text-xs text-gray-500">إجمالي المنتجات</p><p class="text-xl font-extrabold">{{ products().length }}</p></div>
        <div class="card p-3.5"><p class="text-xs text-gray-500">النشطة</p><p class="text-xl font-extrabold text-emerald-700">{{ activeCount() }}</p></div>
        <div class="card p-3.5"><p class="text-xs text-gray-500">مخزون منخفض (≤5)</p><p class="text-xl font-extrabold text-rose-600">{{ lowStockCount() }}</p></div>
        <div class="card p-3.5"><p class="text-xs text-gray-500">المنتجات المميزة</p><p class="text-xl font-extrabold text-amber-700">{{ featuredCount() }}</p></div>
      </div>

      <!-- Filters -->
      <div class="card p-3 flex flex-wrap gap-3 items-center">
        <input class="input flex-1 min-w-[200px]" [(ngModel)]="search" (ngModelChange)="load()" placeholder="ابحث بالاسم أو رمز SKU..." />
        <select class="input w-40" [(ngModel)]="typeFilter" (ngModelChange)="load()">
          <option value="all">كل الأنشطة</option>
          <option value="store">متاجر</option>
          <option value="restaurant">مطاعم</option>
          @for (a of activities(); track a.id) {
            @if (a.slug !== 'store' && a.slug !== 'restaurant') {
              <option [value]="a.slug">{{ a.name }}</option>
            }
          }
        </select>
        <select class="input w-36" [(ngModel)]="statusFilter">
          <option value="">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
        </select>
        <select class="input w-44" [(ngModel)]="categoryFilter">
          <option value="">كل الأقسام</option>
          @for (c of categories(); track c.id) {
            <option [value]="c.id">{{ c.name }}</option>
          }
        </select>
      </div>

      <!-- Table -->
      <div class="card overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-amber-50 text-xs">
            <tr>
              <th class="p-3 text-right">المنتج</th>
              <th class="p-3">القسم</th>
              <th class="p-3">المتجر / البائع</th>
              <th class="p-3">السعر</th>
              <th class="p-3">المخزون</th>
              <th class="p-3">الحالة</th>
              <th class="p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            @for (p of filteredProducts(); track p.id) {
              <tr class="border-t border-amber-100 hover:bg-amber-50/40">
                <td class="p-3">
                  <div class="flex items-center gap-3">
                    <img [src]="img(p.image)" alt="" class="w-12 h-12 rounded-lg object-cover bg-amber-50 border border-amber-100 shrink-0" />
                    <div>
                      <p class="font-bold">{{ p.name }} @if (p.featured) { <span class="text-amber-500 text-xs">★ مميز</span> }</p>
                      <p class="text-xs text-gray-500">{{ p.sku || '—' }} @if (p.brand) { • {{ p.brand }} }</p>
                    </div>
                  </div>
                </td>
                <td class="p-3 text-center text-xs">{{ p.category?.name || '—' }}</td>
                <td class="p-3 text-center text-xs">{{ p.seller?.name || p.seller?.store_name || 'عام' }}</td>
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
                  <span class="badge" [class]="p.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'">
                    {{ p.status === 'active' ? 'نشط' : 'غير نشط' }}
                  </span>
                </td>
                <td class="p-3 text-center whitespace-nowrap space-x-2 space-x-reverse">
                  <button (click)="openForm(p)" class="text-blue-700 font-bold text-xs hover:underline">تعديل</button>
                  <button (click)="remove(p)" class="text-rose-600 text-xs hover:underline">حذف</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="p-10 text-center text-gray-500">لا توجد منتجات مطابقة.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Product Add/Edit Modal -->
      @if (showForm()) {
        <app-admin-product-modal
          [editing]="editing()"
          [categories]="categories()"
          [sellers]="sellers()"
          (close)="showForm.set(false)"
          (saved)="showForm.set(false); load()" />
      }
    </div>
  `
})
export class AdminProductsComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly products = signal<any[]>([]);
  readonly categories = signal<any[]>([]);
  readonly sellers = signal<any[]>([]);
  readonly activities = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);

  search = '';
  typeFilter = 'all';
  statusFilter = '';
  categoryFilter = '';

  readonly activeCount = computed(() => this.products().filter(p => p.status === 'active').length);
  readonly lowStockCount = computed(() => this.products().filter(p => (p.stock ?? 0) <= 5).length);
  readonly featuredCount = computed(() => this.products().filter(p => !!p.featured).length);
  readonly filteredProducts = computed(() => {
    return this.products().filter(p => {
      if (this.statusFilter && p.status !== this.statusFilter) return false;
      if (this.categoryFilter && String(p.category_id) !== String(this.categoryFilter)) return false;
      return true;
    });
  });

  img = resolveAdminImg;

  ngOnInit(): void {
    this.load();
    this.admin.getCategories().subscribe({ next: (c) => this.categories.set(c || []) });
    this.admin.getSellers().subscribe({ next: (s) => this.sellers.set(s || []) });
    this.admin.getActivities().subscribe({ next: (r) => this.activities.set(Array.isArray(r) ? r : r?.data || []) });
  }

  load() {
    this.admin.getProducts(this.search, this.typeFilter).subscribe({ next: (r) => this.products.set(r || []) });
  }

  openForm(row: any | null) {
    this.editing.set(row);
    this.showForm.set(true);
  }

  remove(p: any) {
    if (!confirm(`حذف المنتج "${p.name}"؟`)) return;
    this.admin.deleteProduct(p.id).subscribe({ next: () => { this.toast.success('تم حذف المنتج'); this.load(); } });
  }
}
