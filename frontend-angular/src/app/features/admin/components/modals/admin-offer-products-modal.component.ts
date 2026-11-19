import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-offer-products-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (offer; as off) {
      <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[88vh] overflow-y-auto space-y-4">
          <div class="flex justify-between items-center border-b pb-2">
            <h3 class="font-extrabold">المنتجات المرتبطة بالعرض: {{ off.title }}</h3>
            <button (click)="close.emit()">✕</button>
          </div>
          <div class="flex gap-2">
            <select class="input flex-1" [(ngModel)]="selectedProductId">
              <option [ngValue]="null">اختر منتجاً لإضافته للعرض...</option>
              @for (p of allProducts; track p.id) {
                <option [ngValue]="p.id">{{ p.name }} — {{ p.price }}</option>
              }
            </select>
            <button (click)="attachProduct()" class="btn btn-primary text-xs">إضافة للعرض</button>
          </div>
          <div class="space-y-2">
            @for (p of offerProducts(); track p.id) {
              <div class="flex items-center justify-between p-2.5 border rounded-xl text-sm">
                <div class="flex items-center gap-3">
                  <img [src]="img(p.image)" class="w-10 h-10 rounded object-cover border" />
                  <div><p class="font-bold">{{ p.name }}</p><p class="text-xs text-gray-500">{{ p.price }}</p></div>
                </div>
                <button (click)="detachProduct(p.id)" class="text-rose-600 text-xs font-bold">إزالة</button>
              </div>
            } @empty {
              <p class="text-center text-gray-500 py-6 text-sm">لا توجد منتجات مرتبطة بهذا العرض بعد.</p>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class AdminOfferProductsModalComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  @Input() offer: any = null;
  @Input() allProducts: any[] = [];
  @Output() close = new EventEmitter<void>();

  readonly offerProducts = signal<any[]>([]);
  selectedProductId: number | null = null;
  img = resolveAdminImg;

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts() {
    if (!this.offer) return;
    this.selectedProductId = null;
    this.admin.getOfferProducts(this.offer.id).subscribe({ next: (p) => this.offerProducts.set(p || []) });
  }

  attachProduct() {
    if (!this.offer || !this.selectedProductId) return;
    this.admin.addOfferProduct(this.offer.id, this.selectedProductId).subscribe({
      next: () => { this.toast.success('تم ربط المنتج'); this.loadProducts(); }
    });
  }

  detachProduct(pid: number) {
    if (!this.offer) return;
    this.admin.removeOfferProduct(this.offer.id, pid).subscribe({
      next: () => { this.toast.success('تمت الإزالة'); this.loadProducts(); }
    });
  }
}

