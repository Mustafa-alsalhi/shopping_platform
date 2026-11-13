import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SellerService } from '../../../../core/services/seller.service';
import { StorefrontService } from '../../../../core/services/storefront.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-seller-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="card p-6 space-y-6 max-w-4xl">
      <div class="flex items-center justify-between border-b border-amber-100 pb-3">
        <h1 class="text-xl font-extrabold">{{ id ? 'تعديل المنتج' : 'إضافة منتج جديد' }}</h1>
        <a routerLink="/seller/products" class="text-xs text-gray-500 hover:text-gray-800">العودة للمنتجات ←</a>
      </div>

      <form (ngSubmit)="save()" class="space-y-5">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2"><label class="text-xs font-bold block mb-1">اسم المنتج *</label><input class="input" [(ngModel)]="f.name" name="name" required /></div>
          <div>
            <label class="text-xs font-bold block mb-1">القسم العام *</label>
            <select class="input" [(ngModel)]="f.category_id" name="cat" required>
              <option [ngValue]="null" disabled>اختر القسم</option>
              @for (c of categories(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
            </select>
          </div>
          <div>
            <label class="text-xs font-bold block mb-1">قسم المتجر الخاص</label>
            <select class="input" [(ngModel)]="f.seller_category_id" name="scat">
              <option [ngValue]="null">بدون</option>
              @for (c of sellerCategories(); track c.id) { <option [ngValue]="c.id">{{ c.name }}</option> }
            </select>
          </div>
          <div><label class="text-xs font-bold block mb-1">السعر *</label><input type="number" step="0.01" class="input" [(ngModel)]="f.price" name="price" required /></div>
          <div><label class="text-xs font-bold block mb-1">السعر قبل الخصم</label><input type="number" step="0.01" class="input" [(ngModel)]="f.old_price" name="old" /></div>
          <div><label class="text-xs font-bold block mb-1">المخزون *</label><input type="number" class="input" [(ngModel)]="f.stock" name="stock" required /></div>
          <div><label class="text-xs font-bold block mb-1">SKU</label><input class="input" [(ngModel)]="f.sku" name="sku" placeholder="اختياري" /></div>
          <div><label class="text-xs font-bold block mb-1">الماركة</label><input class="input" [(ngModel)]="f.brand" name="brand" /></div>
          <div>
            <label class="text-xs font-bold block mb-1">الحالة</label>
            <select class="input" [(ngModel)]="f.status" name="status"><option value="active">نشط</option><option value="inactive">غير نشط</option></select>
          </div>
          <div><label class="text-xs font-bold block mb-1">وقت التحضير (دقائق)</label><input type="number" class="input" [(ngModel)]="f.preparation_time" name="prep" /></div>
          <div><label class="text-xs font-bold block mb-1">السعرات الحرارية</label><input type="number" class="input" [(ngModel)]="f.calories" name="cal" /></div>
          <div class="md:col-span-2">
            <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="f.featured" name="featured" /> منتج مميز</label>
          </div>
        </div>

        <div><label class="text-xs font-bold block mb-1">الوصف</label><textarea class="input" rows="3" [(ngModel)]="f.description" name="desc"></textarea></div>

        <!-- Images -->
        <div class="border border-amber-100 rounded-xl p-4 bg-amber-50/30 space-y-3">
          <h2 class="font-extrabold text-sm">الصور والمعرض</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold block mb-1">الصورة الرئيسية</label>
              <input type="file" accept="image/*" (change)="onMain($event)" class="text-xs" />
              @if (mainPreview() || f.image) {
                <img [src]="mainPreview() || img(f.image)" class="h-24 w-24 object-cover rounded-lg mt-2 border" />
              }
            </div>
            <div>
              <label class="text-xs font-bold block mb-1">صور إضافية للمعرض</label>
              <input type="file" multiple accept="image/*" (change)="onFiles($event)" class="text-xs" />
              @if (galleryPreviews().length > 0) {
                <div class="flex flex-wrap gap-2 mt-2">
                  @for (gp of galleryPreviews(); track $index) { <img [src]="gp" class="h-16 w-16 object-cover rounded-lg border" /> }
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Addons -->
        <div class="border border-amber-100 rounded-xl p-4 space-y-2">
          <div class="flex items-center justify-between">
            <h2 class="font-extrabold text-sm">الإضافات الجانبية (للمطاعم والوجبات)</h2>
            <button type="button" (click)="addons.push({ name: '', price: 0 })" class="btn btn-outline text-xs py-1 px-2">+ إضافة</button>
          </div>
          @for (a of addons; track $index) {
            <div class="flex gap-2 items-center">
              <input class="input flex-1 text-xs" [(ngModel)]="a.name" [name]="'an_' + $index" placeholder="اسم الإضافة" />
              <input type="number" step="0.01" class="input w-28 text-xs" [(ngModel)]="a.price" [name]="'ap_' + $index" placeholder="السعر" />
              <button type="button" (click)="addons.splice($index, 1)" class="text-rose-600 text-xs">حذف</button>
            </div>
          }
        </div>

        <!-- Variants -->
        <div class="space-y-3 p-4 bg-amber-50/60 rounded-xl">
          <div class="flex items-center justify-between">
            <h2 class="font-extrabold text-sm">الخيارات والمتغيرات (حجم، لون...)</h2>
            <button type="button" (click)="addVariant()" class="btn btn-outline text-xs py-1 px-2">+ مجموعة خيارات</button>
          </div>
          @for (v of variants; track $index; let vi = $index) {
            <div class="bg-white rounded-xl p-3 space-y-2 border border-amber-200">
              <div class="flex gap-2">
                <input class="input flex-1 text-xs" [(ngModel)]="v.name" [name]="'vn' + vi" placeholder="اسم المجموعة (مثال: الحجم / اللون)" />
                <select class="input w-32 text-xs" [(ngModel)]="v.type" [name]="'vt' + vi"><option value="select">اختيار</option><option value="color">لون</option></select>
                <button type="button" (click)="variants.splice(vi, 1)" class="text-rose-600 text-xs">حذف</button>
              </div>
              @for (o of v.options; track $index; let oi = $index) {
                <div class="flex flex-wrap gap-2 items-center">
                  <input class="input flex-1 text-xs" [(ngModel)]="o.value" [name]="'ov' + vi + '_' + oi" placeholder="القيمة" />
                  @if (v.type === 'color') { <input type="color" [(ngModel)]="o.color_hex" [name]="'oh' + vi + '_' + oi" class="w-9 h-8 rounded border" /> }
                  <input type="number" step="0.01" class="input w-28 text-xs" [(ngModel)]="o.price_adjustment" [name]="'op' + vi + '_' + oi" placeholder="فرق السعر" />
                  <input type="number" class="input w-24 text-xs" [(ngModel)]="o.stock" [name]="'os' + vi + '_' + oi" placeholder="المخزون" />
                  <button type="button" (click)="v.options.splice(oi, 1)" class="text-rose-600 text-xs">×</button>
                </div>
              }
              <button type="button" (click)="v.options.push({ value: '', price_adjustment: 0, stock: 10, color_hex: '#000000' })" class="text-xs text-amber-700 font-bold">+ خيار</button>
            </div>
          }
        </div>

        <div class="flex gap-3">
          <button class="btn btn-primary" [disabled]="saving()">{{ saving() ? 'جاري الحفظ...' : 'حفظ المنتج' }}</button>
          <a routerLink="/seller/products" class="btn btn-outline">إلغاء</a>
        </div>
      </form>
    </div>
  `
})
export class SellerProductFormComponent implements OnInit {
  private readonly seller = inject(SellerService);
  private readonly storefront = inject(StorefrontService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  id: string | null = null;
  readonly saving = signal(false);
  readonly categories = signal<any[]>([]);
  readonly sellerCategories = signal<any[]>([]);
  readonly mainPreview = signal('');
  readonly galleryPreviews = signal<string[]>([]);
  mainFile: File | null = null;
  files: File[] = [];
  addons: { name: string; price: number }[] = [];
  variants: { name: string; type: string; options: { value: string; price_adjustment: number; stock: number; color_hex: string }[] }[] = [];
  f: any = { name: '', sku: '', price: 0, old_price: null, stock: 10, preparation_time: null, category_id: null, seller_category_id: null,
    brand: '', calories: null, status: 'active', featured: false, description: '', image: '' };
  img = resolveAdminImg;

  ngOnInit(): void {
    this.id = this.route.snapshot.params['id'] || null;
    this.storefront.getCategories('all').subscribe({ next: (c) => this.categories.set(c || []) });
    this.seller.getCategories().subscribe({ next: (c) => this.sellerCategories.set(c || []) });
    if (this.id) {
      this.seller.getProduct(this.id).subscribe({
        next: (p) => {
          this.f = { ...this.f, ...p };
          try {
            const pa = typeof p.addons === 'string' ? JSON.parse(p.addons) : p.addons;
            this.addons = Array.isArray(pa) ? pa.map((x: any) => ({ name: x.name || '', price: Number(x.price || 0) })) : [];
          } catch {}
          this.variants = (p.product_variants || []).map((v: any) => ({
            name: v.name, type: v.type || 'select',
            options: (v.options || []).map((o: any) => ({ value: o.value || o.name || '', price_adjustment: Number(o.price_adjustment ?? o.price ?? 0), stock: Number(o.stock ?? 10), color_hex: o.color_hex || '#000000' }))
          }));
        }
      });
    }
  }

  onMain(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.mainFile = file;
    this.mainPreview.set(URL.createObjectURL(file));
  }

  onFiles(e: Event) {
    this.files = Array.from((e.target as HTMLInputElement).files || []);
    this.galleryPreviews.set(this.files.map(f => URL.createObjectURL(f)));
  }

  addVariant() { this.variants.push({ name: '', type: 'select', options: [{ value: '', price_adjustment: 0, stock: 10, color_hex: '#000000' }] }); }

  save() {
    this.saving.set(true);
    const fd = new FormData();
    fd.append('Name', this.f.name || '');
    fd.append('Description', this.f.description || '');
    fd.append('Price', String(this.f.price ?? 0));
    if (this.f.old_price) fd.append('OldPrice', String(this.f.old_price));
    fd.append('Stock', String(this.f.stock ?? 0));
    if (this.f.category_id) fd.append('CategoryId', String(this.f.category_id));
    if (this.f.seller_category_id) fd.append('SellerCategoryId', String(this.f.seller_category_id));
    if (this.f.brand) fd.append('Brand', this.f.brand);
    if (this.f.sku) fd.append('Sku', this.f.sku);
    fd.append('Status', this.f.status || 'active');
    fd.append('Featured', String(!!this.f.featured));
    if (this.f.preparation_time) fd.append('PreparationTime', String(this.f.preparation_time));
    if (this.f.calories) fd.append('Calories', String(this.f.calories));
    fd.append('Addons', JSON.stringify(this.addons.filter(a => a.name.trim())));
    fd.append('Variants', JSON.stringify(this.variants.filter(v => v.name.trim()).map(v => ({
      name: v.name, type: v.type,
      options: v.options.filter(o => o.value.trim()).map(o => ({
        value: o.value, priceAdjustment: Number(o.price_adjustment || 0), stock: Number(o.stock || 0), colorHex: v.type === 'color' ? o.color_hex : null
      }))
    }))));
    if (this.mainFile) fd.append('image', this.mainFile);
    this.files.forEach(f => fd.append('images', f));

    const req = this.id ? this.seller.updateProduct(this.id, fd) : this.seller.createProduct(fd);
    req.subscribe({
      next: () => { this.saving.set(false); this.toast.success('تم حفظ المنتج'); this.router.navigate(['/seller/products']); },
      error: (e) => { this.saving.set(false); this.toast.error(e.error?.message || 'تعذر الحفظ'); }
    });
  }
}
