import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-product-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[92vh] overflow-y-auto space-y-5">
        <div class="flex items-center justify-between border-b border-amber-100 pb-3">
          <h3 class="text-lg font-extrabold">{{ editing ? 'تعديل المنتج' : 'إضافة منتج جديد' }}</h3>
          <button type="button" (click)="close.emit()" class="text-gray-500 hover:text-gray-800 text-lg">✕</button>
        </div>

        <!-- Basic Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="text-xs font-bold block mb-1">اسم المنتج *</label>
            <input class="input" [(ngModel)]="m.name" name="name" required placeholder="مثال: برجر لحم مشوي / ساعة ذكية" />
          </div>
          <div>
            <label class="text-xs font-bold block mb-1">القسم *</label>
            <select class="input" [(ngModel)]="m.category_id" name="category_id" required>
              <option [ngValue]="null" disabled>اختر القسم</option>
              @for (c of categories; track c.id) {
                <option [ngValue]="c.id">{{ c.name }} ({{ c.type }})</option>
              }
            </select>
          </div>
          <div>
            <label class="text-xs font-bold block mb-1">البائع / المتجر</label>
            <select class="input" [(ngModel)]="m.seller_id" name="seller_id">
              <option [ngValue]="null">— متجر عام (بدون بائع محدد) —</option>
              @for (s of sellers; track s.id) {
                <option [ngValue]="s.id">{{ s.name || s.store_name }} ({{ s.type }})</option>
              }
            </select>
          </div>
          <div>
            <label class="text-xs font-bold block mb-1">السعر *</label>
            <input type="number" step="0.01" class="input" [(ngModel)]="m.price" name="price" required />
          </div>
          <div>
            <label class="text-xs font-bold block mb-1">السعر القديم (قبل الخصم)</label>
            <input type="number" step="0.01" class="input" [(ngModel)]="m.old_price" name="old_price" />
          </div>
          <div>
            <label class="text-xs font-bold block mb-1">الكمية في المخزون *</label>
            <input type="number" class="input" [(ngModel)]="m.stock" name="stock" required />
          </div>
          <div>
            <label class="text-xs font-bold block mb-1">العلامة التجارية</label>
            <input class="input" [(ngModel)]="m.brand" name="brand" placeholder="اختياري" />
          </div>
          <div>
            <label class="text-xs font-bold block mb-1">رمز SKU</label>
            <input class="input" [(ngModel)]="m.sku" name="sku" placeholder="يُنشأ تلقائياً إذا تُرك فارغاً" />
          </div>
          <div>
            <label class="text-xs font-bold block mb-1">الحالة</label>
            <select class="input" [(ngModel)]="m.status" name="status">
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
          </div>
          <div class="md:col-span-2">
            <label class="text-xs font-bold block mb-1">وصف المنتج</label>
            <textarea class="input" rows="3" [(ngModel)]="m.description" name="description" placeholder="وصف تفصيلي للمنتج أو الوجبة..."></textarea>
          </div>
          <div>
            <label class="text-xs font-bold block mb-1">الوزن (كجم)</label>
            <input type="number" step="0.01" class="input" [(ngModel)]="m.weight" name="weight" />
          </div>
          <div>
            <label class="text-xs font-bold block mb-1">الأبعاد</label>
            <input class="input" [(ngModel)]="m.dimensions" name="dimensions" placeholder="مثال: 20x15x10 سم" />
          </div>
          <div class="md:col-span-2">
            <label class="text-xs font-bold block mb-1">المواصفات الفنية</label>
            <textarea class="input" rows="2" [(ngModel)]="m.specifications" name="specifications" placeholder="مواصفات إضافية..."></textarea>
          </div>
          <div class="md:col-span-2 flex items-center gap-4">
            <label class="flex items-center gap-2 text-sm font-bold cursor-pointer">
              <input type="checkbox" [(ngModel)]="m.featured" name="featured" />
              <span>منتج مميز (يظهر في الرئيسية)</span>
            </label>
          </div>
        </div>

        <!-- Images -->
        <div class="border border-amber-100 rounded-xl p-4 space-y-3 bg-amber-50/30">
          <h4 class="font-extrabold text-sm">الصور والمعرض</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold block mb-1">الصورة الرئيسية</label>
              <input type="file" accept="image/*" (change)="onMainImage($event)" class="text-xs" />
              <input class="input mt-2 text-xs" [(ngModel)]="m.image_url" name="image_url" placeholder="أو أدخل رابط الصورة مباشرة" />
              @if (mainPreview() || m.image_url) {
                <img [src]="mainPreview() || img(m.image_url)" class="h-24 w-24 object-cover rounded-lg mt-2 border" />
              }
            </div>
            <div>
              <label class="text-xs font-bold block mb-1">صور المعرض (متعددة)</label>
              <input type="file" accept="image/*" multiple (change)="onGallery($event)" class="text-xs" />
              @if (galleryPreviews().length > 0) {
                <div class="flex flex-wrap gap-2 mt-2">
                  @for (gp of galleryPreviews(); track $index) {
                    <img [src]="gp" class="h-16 w-16 object-cover rounded-lg border" />
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Restaurant Options -->
        <div class="border border-amber-100 rounded-xl p-4 space-y-3">
          <h4 class="font-extrabold text-sm">خيارات المطاعم والوجبات (اختياري)</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold block mb-1">مدة التحضير (بالدقائق)</label>
              <input type="number" class="input" [(ngModel)]="m.preparation_time" name="preparation_time" placeholder="مثال: 25" />
            </div>
            <div>
              <label class="text-xs font-bold block mb-1">السعرات الحرارية</label>
              <input type="number" class="input" [(ngModel)]="m.calories" name="calories" placeholder="مثال: 450" />
            </div>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold">الإضافات الجانبية (Add-ons)</span>
              <button type="button" (click)="addAddon()" class="btn btn-outline text-xs py-1 px-2">+ إضافة</button>
            </div>
            @for (a of addons; track $index) {
              <div class="flex gap-2 items-center">
                <input class="input flex-1 text-xs" [(ngModel)]="a.name" [name]="'addon_n_' + $index" placeholder="اسم الإضافة (مثال: جبنة إضافية)" />
                <input type="number" step="0.01" class="input w-28 text-xs" [(ngModel)]="a.price" [name]="'addon_p_' + $index" placeholder="السعر" />
                <button type="button" (click)="addons.splice($index, 1)" class="text-rose-600 text-xs px-2">حذف</button>
              </div>
            }
          </div>
        </div>

        <!-- Variants Builder -->
        <div class="border border-amber-100 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="font-extrabold text-sm">المتغيرات والخيارات (الألوان، الأحجام، إلخ)</h4>
            <button type="button" (click)="addVariant()" class="btn btn-outline text-xs py-1 px-2">+ متغير جديد</button>
          </div>
          @for (v of variants; track $index; let vi = $index) {
            <div class="p-3 bg-amber-50/40 rounded-xl border border-amber-100 space-y-2">
              <div class="flex flex-wrap gap-2 items-center">
                <input class="input flex-1 text-xs" [(ngModel)]="v.name" [name]="'v_name_' + vi" placeholder="اسم المتغير (مثال: اللون / المقاس)" />
                <select class="input w-32 text-xs" [(ngModel)]="v.type" [name]="'v_type_' + vi">
                  <option value="select">قائمة / نص</option>
                  <option value="color">لون</option>
                </select>
                <button type="button" (click)="addVariantOption(vi)" class="btn btn-outline text-xs py-1 px-2">+ خيار</button>
                <button type="button" (click)="variants.splice(vi, 1)" class="text-rose-600 text-xs px-2">حذف المتغير</button>
              </div>
              @for (o of v.options; track $index; let oi = $index) {
                <div class="flex flex-wrap gap-2 items-center pr-3">
                  <input class="input flex-1 min-w-[120px] text-xs" [(ngModel)]="o.value" [name]="'o_val_' + vi + '_' + oi" placeholder="القيمة (مثال: أحمر / XL)" />
                  @if (v.type === 'color') {
                    <input type="color" [(ngModel)]="o.color_hex" [name]="'o_hex_' + vi + '_' + oi" class="w-9 h-8 rounded border cursor-pointer" />
                  }
                  <input type="number" step="0.01" class="input w-28 text-xs" [(ngModel)]="o.price_adjustment" [name]="'o_pa_' + vi + '_' + oi" placeholder="فرق السعر" />
                  <input type="number" class="input w-24 text-xs" [(ngModel)]="o.stock" [name]="'o_st_' + vi + '_' + oi" placeholder="المخزون" />
                  <button type="button" (click)="v.options.splice(oi, 1)" class="text-rose-600 text-xs">✕</button>
                </div>
              }
            </div>
          }
        </div>

        <div class="flex gap-3 pt-2 border-t border-amber-100">
          <button class="btn btn-primary" [disabled]="saving()">{{ saving() ? 'جاري الحفظ...' : 'حفظ المنتج' }}</button>
          <button type="button" (click)="close.emit()" class="btn btn-outline">إلغاء</button>
        </div>
      </form>
    </div>
  `
})
export class AdminProductModalComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  @Input() editing: any = null;
  @Input() categories: any[] = [];
  @Input() sellers: any[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  readonly saving = signal(false);
  readonly mainPreview = signal('');
  readonly galleryPreviews = signal<string[]>([]);

  m: any = {};
  mainFile: File | null = null;
  galleryFiles: File[] = [];
  addons: { name: string; price: number }[] = [];
  variants: { name: string; type: string; options: { value: string; price_adjustment: number; stock: number; color_hex: string }[] }[] = [];
  img = resolveAdminImg;

  ngOnInit(): void {
    const row = this.editing;
    this.mainFile = null;
    this.galleryFiles = [];
    this.mainPreview.set('');
    this.galleryPreviews.set([]);

    if (row) {
      this.m = {
        name: row.name || '',
        description: row.description || '',
        price: row.price ?? 0,
        old_price: row.old_price ?? null,
        stock: row.stock ?? 0,
        category_id: row.category_id ?? null,
        seller_id: row.seller_id ?? null,
        brand: row.brand || '',
        sku: row.sku || '',
        weight: row.weight ?? null,
        dimensions: row.dimensions || '',
        specifications: row.specifications || '',
        status: row.status || 'active',
        featured: !!row.featured,
        preparation_time: row.preparation_time ?? null,
        calories: row.calories ?? null,
        image_url: row.image || ''
      };
      try {
        const parsedAddons = typeof row.addons === 'string' ? JSON.parse(row.addons) : row.addons;
        this.addons = Array.isArray(parsedAddons) ? parsedAddons.map((x: any) => ({ name: x.name || '', price: Number(x.price || 0) })) : [];
      } catch { this.addons = []; }

      const rawVars = row.product_variants || row.variants || [];
      this.variants = Array.isArray(rawVars) ? rawVars.map((v: any) => ({
        name: v.name || '',
        type: v.type || 'select',
        options: Array.isArray(v.options) ? v.options.map((o: any) => ({
          value: o.value || '',
          price_adjustment: Number(o.price_adjustment ?? 0),
          stock: Number(o.stock ?? 10),
          color_hex: o.color_hex || '#000000'
        })) : []
      })) : [];

      try {
        const imgs = typeof row.images === 'string' ? JSON.parse(row.images) : row.images;
        if (Array.isArray(imgs)) this.galleryPreviews.set(imgs.map((x: string) => this.img(x)));
      } catch {}
    } else {
      this.m = {
        name: '', description: '', price: 0, old_price: null, stock: 10,
        category_id: this.categories[0]?.id || 1, seller_id: null,
        brand: '', sku: '', weight: null, dimensions: '', specifications: '',
        status: 'active', featured: false, preparation_time: null, calories: null, image_url: ''
      };
      this.addons = [];
      this.variants = [];
    }
  }

  onMainImage(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.mainFile = file;
    this.mainPreview.set(URL.createObjectURL(file));
  }

  onGallery(e: Event) {
    const files = Array.from((e.target as HTMLInputElement).files || []);
    if (!files.length) return;
    this.galleryFiles = files;
    this.galleryPreviews.set(files.map(f => URL.createObjectURL(f)));
  }

  addAddon() { this.addons.push({ name: '', price: 0 }); }
  addVariant() { this.variants.push({ name: '', type: 'select', options: [{ value: '', price_adjustment: 0, stock: 10, color_hex: '#000000' }] }); }
  addVariantOption(vi: number) { this.variants[vi].options.push({ value: '', price_adjustment: 0, stock: 10, color_hex: '#000000' }); }

  save() {
    this.saving.set(true);
    const fd = new FormData();
    fd.append('Name', this.m.name || '');
    fd.append('Description', this.m.description || '');
    fd.append('Price', String(this.m.price ?? 0));
    if (this.m.old_price !== null && this.m.old_price !== '') fd.append('OldPrice', String(this.m.old_price));
    fd.append('Stock', String(this.m.stock ?? 0));
    if (this.m.category_id) fd.append('CategoryId', String(this.m.category_id));
    if (this.m.seller_id) fd.append('seller_id', String(this.m.seller_id));
    if (this.m.brand) fd.append('Brand', this.m.brand);
    if (this.m.sku) fd.append('Sku', this.m.sku);
    if (this.m.weight !== null && this.m.weight !== '') fd.append('Weight', String(this.m.weight));
    if (this.m.dimensions) fd.append('Dimensions', this.m.dimensions);
    if (this.m.specifications) fd.append('Specifications', this.m.specifications);
    fd.append('Status', this.m.status || 'active');
    fd.append('Featured', String(!!this.m.featured));
    if (this.m.preparation_time !== null && this.m.preparation_time !== '') fd.append('PreparationTime', String(this.m.preparation_time));
    if (this.m.calories !== null && this.m.calories !== '') fd.append('Calories', String(this.m.calories));
    if (this.m.image_url) fd.append('ImageUrl', this.m.image_url);

    const validAddons = this.addons.filter(a => a.name.trim());
    fd.append('Addons', JSON.stringify(validAddons));

    const validVariants = this.variants
      .filter(v => v.name.trim())
      .map(v => ({
        name: v.name,
        type: v.type,
        options: v.options.filter(o => o.value.trim()).map(o => ({
          value: o.value,
          priceAdjustment: Number(o.price_adjustment || 0),
          stock: Number(o.stock || 0),
          colorHex: v.type === 'color' ? o.color_hex : null
        }))
      }));
    fd.append('Variants', JSON.stringify(validVariants));

    if (this.mainFile) fd.append('image', this.mainFile);
    this.galleryFiles.forEach(f => fd.append('images', f));

    const row = this.editing;
    const req = row ? this.admin.updateProduct(row.id, fd) : this.admin.createProduct(fd);
    req.subscribe({
      next: () => { this.saving.set(false); this.toast.success('تم حفظ المنتج بنجاح'); this.saved.emit(); },
      error: (e) => { this.saving.set(false); this.toast.error(e.error?.message || 'تعذر حفظ المنتج'); }
    });
  }
}
