import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerService } from '../../../../core/services/seller.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-seller-offers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-extrabold">العروض والتخفيضات</h1>
          <p class="text-xs text-gray-500">إنشاء عروض ترويجية لمتجرك وربط المنتجات بها</p>
        </div>
        <button (click)="openForm(null)" class="btn btn-primary text-sm">+ إضافة عرض</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (o of offers(); track o.id) {
          <div class="card overflow-hidden flex flex-col">
            <div class="h-36 bg-amber-50 relative">
              @if (o.image) { <img [src]="img(o.image)" class="w-full h-full object-cover" /> }
              <span class="badge bg-rose-600 text-white absolute top-2 right-2">خصم {{ o.discount_percentage }}%</span>
              <span class="badge absolute top-2 left-2" [class]="o.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'">{{ o.active ? 'نشط' : 'متوقف' }}</span>
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 class="font-extrabold">{{ o.title }}</h3>
                <p class="text-xs text-gray-500 line-clamp-2">{{ o.description }}</p>
              </div>
              <div class="flex justify-between items-center pt-2 border-t border-amber-50 text-xs">
                <button (click)="openProducts(o)" class="btn btn-outline text-xs py-1 px-2">المنتجات المرتبطة</button>
                <div class="space-x-2 space-x-reverse">
                  <button (click)="openForm(o)" class="text-blue-700 font-bold">تعديل</button>
                  <button (click)="remove(o)" class="text-rose-600">حذف</button>
                </div>
              </div>
            </div>
          </div>
        } @empty { <div class="card p-10 text-center text-gray-500 md:col-span-3">لا توجد عروض.</div> }
      </div>

      @if (showForm()) {
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="font-extrabold">{{ editing() ? 'تعديل العرض' : 'إضافة عرض جديد' }}</h3>
              <button type="button" (click)="showForm.set(false)">✕</button>
            </div>
            <div><label class="text-xs font-bold block mb-1">عنوان العرض *</label><input class="input" [(ngModel)]="m.title" name="title" required /></div>
            <div><label class="text-xs font-bold block mb-1">الوصف</label><textarea class="input" rows="2" [(ngModel)]="m.description" name="description"></textarea></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-xs font-bold block mb-1">نسبة الخصم % *</label><input type="number" class="input" [(ngModel)]="m.discount_percentage" name="discount" required /></div>
              <div><label class="text-xs font-bold block mb-1">صالح حتى</label><input type="date" class="input" [(ngModel)]="m.valid_until" name="valid_until" /></div>
            </div>
            <div>
              <label class="text-xs font-bold block mb-1">صورة العرض</label>
              <input type="file" accept="image/*" (change)="onFile($event)" class="text-xs" />
              @if (preview() || m.image) { <img [src]="preview() || img(m.image)" class="h-24 mt-2 rounded-lg border object-cover" /> }
            </div>
            <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="m.active" name="active" /> عرض نشط</label>
            <div class="flex gap-3 pt-2">
              <button class="btn btn-primary">حفظ</button>
              <button type="button" (click)="showForm.set(false)" class="btn btn-outline">إلغاء</button>
            </div>
          </form>
        </div>
      }

      @if (productsOffer(); as off) {
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[85vh] overflow-y-auto space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="font-extrabold">منتجات العرض: {{ off.title }}</h3>
              <button (click)="productsOffer.set(null)">✕</button>
            </div>
            <div class="flex gap-2">
              <select class="input flex-1" [(ngModel)]="selectedPid">
                <option [ngValue]="null">اختر منتجاً...</option>
                @for (p of allProducts(); track p.id) { <option [ngValue]="p.id">{{ p.name }} — {{ p.price }}</option> }
              </select>
              <button (click)="attach()" class="btn btn-primary text-xs">إضافة</button>
            </div>
            @for (p of offerProducts(); track p.id) {
              <div class="flex justify-between items-center p-2 border rounded-xl text-sm">
                <span class="font-bold">{{ p.name }}</span>
                <button (click)="detach(p.id)" class="text-rose-600 text-xs">إزالة</button>
              </div>
            } @empty { <p class="text-center text-gray-500 py-4 text-sm">لا توجد منتجات مرتبطة.</p> }
          </div>
        </div>
      }
    </div>
  `
})
export class SellerOffersComponent implements OnInit {
  private readonly seller = inject(SellerService);
  private readonly toast = inject(ToastService);

  readonly offers = signal<any[]>([]);
  readonly allProducts = signal<any[]>([]);
  readonly offerProducts = signal<any[]>([]);
  readonly productsOffer = signal<any>(null);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  readonly preview = signal('');
  file: File | null = null;
  selectedPid: number | null = null;
  m: any = {};
  img = resolveAdminImg;

  ngOnInit(): void {
    this.load();
    this.seller.getProducts().subscribe({ next: (p) => this.allProducts.set(p || []) });
  }
  load() { this.seller.getOffers().subscribe({ next: (r) => this.offers.set(r || []) }); }

  openForm(o: any | null) {
    this.editing.set(o);
    this.file = null;
    this.preview.set('');
    this.m = o ? { ...o, valid_until: o.valid_until ? String(o.valid_until).slice(0, 10) : '' } : { title: '', description: '', discount_percentage: 15, valid_until: '', active: true };
    this.showForm.set(true);
  }

  onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.file = f;
    this.preview.set(URL.createObjectURL(f));
  }

  save() {
    const fd = new FormData();
    fd.append('Title', this.m.title || '');
    fd.append('Description', this.m.description || '');
    fd.append('DiscountPercentage', String(this.m.discount_percentage ?? 0));
    if (this.m.valid_until) fd.append('ValidUntil', this.m.valid_until);
    fd.append('Active', String(!!this.m.active));
    if (this.file) fd.append('image', this.file);

    const o = this.editing();
    const req = o ? this.seller.updateOffer(o.id, fd) : this.seller.createOffer(fd);
    req.subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.showForm.set(false); this.load(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }

  remove(o: any) { if (confirm('حذف العرض؟')) this.seller.deleteOffer(o.id).subscribe({ next: () => this.load() }); }

  openProducts(o: any) {
    this.productsOffer.set(o);
    this.selectedPid = null;
    this.seller.getOfferProducts(o.id).subscribe({ next: (p) => this.offerProducts.set(p || []) });
  }
  attach() {
    const o = this.productsOffer();
    if (!o || !this.selectedPid) return;
    this.seller.addOfferProduct(o.id, this.selectedPid).subscribe({ next: () => this.openProducts(o) });
  }
  detach(pid: number) {
    const o = this.productsOffer();
    if (!o) return;
    this.seller.removeOfferProduct(o.id, pid).subscribe({ next: () => this.openProducts(o) });
  }
}
