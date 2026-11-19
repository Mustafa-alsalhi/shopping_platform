import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';
import { AdminOfferModalComponent } from '../../components/modals/admin-offer-modal.component';
import { AdminOfferProductsModalComponent } from '../../components/modals/admin-offer-products-modal.component';

@Component({
  selector: 'app-admin-offers',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminOfferModalComponent, AdminOfferProductsModalComponent],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-extrabold">العروض الترويجية</h1>
          <p class="text-xs text-gray-500">إدارة العروض والخصومات وربط المنتجات بكل عرض</p>
        </div>
        <button (click)="openForm(null)" class="btn btn-primary text-sm">+ إضافة عرض جديد</button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (o of offers(); track o.id) {
          <div class="card overflow-hidden flex flex-col">
            <div class="h-36 bg-amber-50 relative">
              @if (o.image) { <img [src]="img(o.image)" class="w-full h-full object-cover" /> }
              <span class="badge bg-rose-600 text-white absolute top-2 right-2">خصم {{ o.discount_percentage }}%</span>
              <span class="badge absolute top-2 left-2" [class]="o.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700'">
                {{ o.active ? 'نشط' : 'متوقف' }}
              </span>
            </div>
            <div class="p-4 flex-1 flex flex-col justify-between space-y-3">
              <div>
                <h3 class="font-extrabold">{{ o.title }} @if (o.featured) { <span class="text-amber-500 text-xs">★</span> }</h3>
                <p class="text-xs text-gray-500 line-clamp-2">{{ o.description }}</p>
                <p class="text-xs text-gray-400 mt-1">الفئة: {{ o.category }} • ينتهي: {{ o.valid_until ? (o.valid_until | date:'yyyy-MM-dd') : '—' }}</p>
              </div>
              <div class="flex flex-wrap gap-2 justify-between items-center pt-2 border-t border-amber-50 text-xs">
                <button (click)="openProducts(o)" class="btn btn-outline text-xs py-1 px-2.5">المنتجات المرتبطة</button>
                <div class="space-x-2 space-x-reverse">
                  <button (click)="openForm(o)" class="text-blue-700 font-bold">تعديل</button>
                  <button (click)="remove(o)" class="text-rose-600">حذف</button>
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <div class="card p-10 text-center text-gray-500 md:col-span-3">لا توجد عروض.</div>
        }
      </div>

      <!-- Offer Form Modal -->
      @if (showForm()) {
        <app-admin-offer-modal [editing]="editing()" (close)="showForm.set(false)" (saved)="showForm.set(false); load()" />
      }

      <!-- Offer Products Modal -->
      @if (productsOffer(); as off) {
        <app-admin-offer-products-modal [offer]="off" [allProducts]="allProducts()" (close)="productsOffer.set(null)" />
      }
    </div>
  `
})
export class AdminOffersComponent implements OnInit {
  private readonly admin = inject(AdminService);

  readonly offers = signal<any[]>([]);
  readonly allProducts = signal<any[]>([]);
  readonly productsOffer = signal<any>(null);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);

  img = resolveAdminImg;

  ngOnInit(): void {
    this.load();
    this.admin.getProducts().subscribe({ next: (p) => this.allProducts.set(p || []) });
  }

  load() { this.admin.getOffers().subscribe({ next: (r) => this.offers.set(r || []) }); }

  openForm(row: any | null) {
    this.editing.set(row);
    this.showForm.set(true);
  }

  remove(o: any) { if (confirm('حذف العرض؟')) this.admin.deleteOffer(o.id).subscribe({ next: () => this.load() }); }

  openProducts(o: any) {
    this.productsOffer.set(o);
  }
}
