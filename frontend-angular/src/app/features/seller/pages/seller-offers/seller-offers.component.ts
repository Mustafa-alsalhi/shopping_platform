import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerService } from '../../../../core/services/seller.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';
import { SellerOfferModalComponent, SellerOfferProductsModalComponent } from '../../components/modals/seller-offer-modal.component';

@Component({
  selector: 'app-seller-offers',
  standalone: true,
  imports: [CommonModule, FormsModule, SellerOfferModalComponent, SellerOfferProductsModalComponent],
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
        <app-seller-offer-modal
          [isEditing]="!!editing()"
          [model]="m"
          [preview]="preview()"
          (fileSelected)="onFile($event)"
          (saved)="save()"
          (closed)="showForm.set(false)" />
      }

      @if (productsOffer(); as off) {
        <app-seller-offer-products-modal
          [offer]="off"
          [allProducts]="allProducts()"
          [offerProducts]="offerProducts()"
          (attached)="attach($event)"
          (detached)="detach($event)"
          (closed)="productsOffer.set(null)" />
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
  attach(pid?: number) {
    const o = this.productsOffer();
    const targetPid = pid ?? this.selectedPid;
    if (!o || !targetPid) return;
    this.seller.addOfferProduct(o.id, targetPid).subscribe({ next: () => this.openProducts(o) });
  }
  detach(pid: number) {
    const o = this.productsOffer();
    if (!o) return;
    this.seller.removeOfferProduct(o.id, pid).subscribe({ next: () => this.openProducts(o) });
  }
}
