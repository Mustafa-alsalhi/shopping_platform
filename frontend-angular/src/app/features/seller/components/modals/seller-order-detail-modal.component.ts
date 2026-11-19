import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-seller-order-detail-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl">
      <div class="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[88vh] overflow-y-auto space-y-4">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="font-extrabold">تفاصيل الطلب #{{ order().order_number }}</h3>
          <button (click)="closed.emit()">✕</button>
        </div>
        <div class="text-sm bg-amber-50/50 p-3 rounded-xl space-y-1">
          <p><b>العميل:</b> {{ order().user?.name }} — {{ order().user?.phone }}</p>
          <p><b>العنوان:</b> {{ order().shipping_address || order().address }}</p>
          <p><b>الدفع:</b> {{ order().payment_method || '—' }}</p>
        </div>
        <div class="space-y-2">
          @for (it of order().items; track it.id) {
            <div class="flex items-center justify-between p-2 border rounded-xl text-sm">
              <div class="flex items-center gap-2.5">
                @if (it.product?.image) { <img [src]="img(it.product.image)" class="w-10 h-10 rounded object-cover border" /> }
                <div><p class="font-bold">{{ it.product?.name || it.product_name }}</p><p class="text-xs text-gray-500">{{ it.quantity }} × {{ it.price | number:'1.0-2' }}</p></div>
              </div>
              <span class="font-bold">{{ it.total | number:'1.0-2' }}</span>
            </div>
          }
        </div>
        <div class="flex justify-between font-extrabold border-t pt-2"><span>الإجمالي:</span><span class="text-amber-700">{{ order().total | number:'1.0-2' }}</span></div>
      </div>
    </div>
  `
})
export class SellerOrderDetailModalComponent {
  readonly order = input.required<any>();
  readonly closed = output<void>();
  img = resolveAdminImg;
}
