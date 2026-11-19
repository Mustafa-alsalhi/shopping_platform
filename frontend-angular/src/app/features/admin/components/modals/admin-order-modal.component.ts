import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ORDER_STATUS_LABELS } from '../../../../shared/constants/order-status';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-order-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (order; as ord) {
      <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
          <div class="flex justify-between items-center border-b pb-2">
            <h3 class="font-extrabold text-lg">تفاصيل الطلب #{{ ord.order_number }}</h3>
            <button (click)="close.emit()">✕</button>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm bg-amber-50/50 p-4 rounded-xl">
            <div>
              <p class="text-xs text-gray-500">العميل</p>
              <p class="font-bold">{{ ord.user?.name }} — {{ ord.user?.phone }}</p>
              <p class="text-xs text-gray-600">{{ ord.shipping_address || ord.address }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500">الدفع والحالة</p>
              <p class="font-bold">{{ ord.payment_method }} • {{ label(ord.status) }}</p>
              <p class="text-xs text-gray-600">المندوب: {{ ord.driver?.name || 'غير مسند' }}</p>
            </div>
          </div>
          <div class="space-y-2">
            <h4 class="font-extrabold text-sm">المنتجات</h4>
            @for (it of ord.items || ord.order_items || []; track it.id) {
              <div class="flex items-center justify-between p-2.5 border rounded-xl text-sm">
                <div class="flex items-center gap-3">
                  @if (it.product?.image) { <img [src]="img(it.product.image)" class="w-10 h-10 rounded object-cover border" /> }
                  <div>
                    <p class="font-bold">{{ it.product?.name || it.product_name }}</p>
                    <p class="text-xs text-gray-500">الكمية: {{ it.quantity }} × {{ it.price | number:'1.0-2' }}</p>
                  </div>
                </div>
                <span class="font-bold">{{ (it.total ?? it.quantity * it.price) | number:'1.0-2' }}</span>
              </div>
            }
          </div>
          <div class="border-t pt-3 text-sm space-y-1">
            <div class="flex justify-between"><span>المجموع الفرعي:</span><span>{{ ord.subtotal | number:'1.0-2' }}</span></div>
            <div class="flex justify-between"><span>التوصيل:</span><span>{{ ord.shipping_cost | number:'1.0-2' }}</span></div>
            <div class="flex justify-between"><span>الضريبة:</span><span>{{ ord.tax_amount | number:'1.0-2' }}</span></div>
            @if (ord.discount_amount) { <div class="flex justify-between text-emerald-700"><span>الخصم:</span><span>-{{ ord.discount_amount | number:'1.0-2' }}</span></div> }
            <div class="flex justify-between font-extrabold text-base border-t pt-2"><span>الإجمالي:</span><span class="text-amber-700">{{ ord.total | number:'1.0-2' }}</span></div>
          </div>
        </div>
      </div>
    }
  `
})
export class AdminOrderModalComponent {
  @Input() order: any = null;
  @Output() close = new EventEmitter<void>();

  img = resolveAdminImg;

  label(s: string) {
    return ORDER_STATUS_LABELS[s] || s;
  }
}

