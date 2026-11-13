import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SellerService } from '../../../../core/services/seller.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-seller-payment-requests',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-5">
      <div>
        <h1 class="text-xl font-extrabold">عمليات الدفع والحوالات</h1>
        <p class="text-xs text-gray-500">متابعة طلبات الدفع المرتبطة بطلبات متجرك</p>
      </div>

      <div class="card overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-amber-50 text-xs">
            <tr><th class="p-3">الطلب</th><th class="p-3">المرسل</th><th class="p-3">المبلغ</th><th class="p-3">رقم المرجع</th><th class="p-3">الإيصال</th><th class="p-3">الحالة</th></tr>
          </thead>
          <tbody>
            @for (r of requests(); track r.id) {
              <tr class="border-t border-amber-100 text-center">
                <td class="p-3 font-bold">#{{ r.order?.order_number || r.order_id }}</td>
                <td>{{ r.payer_name || r.user?.name }}</td>
                <td class="font-bold">{{ r.payment_amount | number:'1.0-2' }}</td>
                <td class="font-mono text-xs">{{ r.reference_number || '—' }}</td>
                <td>
                  @if (r.receipt_image || r.payment_proof) {
                    <button (click)="previewUrl.set(img(r.receipt_image || r.payment_proof))" class="text-amber-700 font-bold text-xs underline">عرض الإيصال</button>
                  } @else { — }
                </td>
                <td>
                  <span class="badge" [class]="r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : r.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'">
                    {{ r.status === 'approved' ? 'مقبول' : r.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة' }}
                  </span>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="p-8 text-center text-gray-500">لا توجد عمليات دفع.</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (previewUrl()) {
        <div class="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4" (click)="previewUrl.set('')">
          <img [src]="previewUrl()" class="max-h-[85vh] max-w-full rounded-2xl shadow-2xl" />
        </div>
      }
    </div>
  `
})
export class SellerPaymentRequestsComponent implements OnInit {
  private readonly seller = inject(SellerService);
  readonly requests = signal<any[]>([]);
  readonly previewUrl = signal('');
  img = resolveAdminImg;

  ngOnInit(): void {
    this.seller.getPaymentRequests().subscribe({ next: (r) => this.requests.set(r?.data || r || []) });
  }
}
