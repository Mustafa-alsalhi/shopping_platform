import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-payment-request-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (reviewing; as rev) {
      <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
          <div class="flex justify-between items-center border-b pb-2">
            <h3 class="font-extrabold">مراجعة طلب الدفع #{{ rev.order?.order_number || rev.order_id }}</h3>
            <button (click)="close.emit()">✕</button>
          </div>
          <div class="text-sm space-y-1 bg-amber-50/50 p-3 rounded-xl">
            <p><b>المرسل:</b> {{ rev.payer_name }}</p>
            <p><b>المبلغ:</b> {{ rev.payment_amount | number:'1.0-2' }}</p>
            <p><b>المرجع:</b> {{ rev.reference_number || '—' }}</p>
          </div>
          @if (rev.receipt_image || rev.payment_proof) {
            <img [src]="img(rev.receipt_image || rev.payment_proof)" class="max-h-56 mx-auto rounded-xl border" />
          }
          <div>
            <label class="text-xs font-bold block mb-1">ملاحظات الإدارة</label>
            <textarea class="input" rows="2" [(ngModel)]="adminNotes" placeholder="سبب القبول أو الرفض..."></textarea>
          </div>
          <div class="flex gap-2">
            <button (click)="decide('approved')" class="btn btn-success text-xs">اعتماد الدفع</button>
            <button (click)="decide('rejected')" class="btn btn-error text-xs">رفض</button>
            <button (click)="close.emit()" class="btn btn-outline text-xs">إغلاق</button>
          </div>
        </div>
      </div>
    }

    @if (previewUrl) {
      <div class="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4" (click)="closePreview.emit()">
        <img [src]="previewUrl" class="max-h-[85vh] max-w-full rounded-2xl shadow-2xl" />
      </div>
    }
  `
})
export class AdminPaymentRequestModalComponent implements OnChanges {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  @Input() reviewing: any = null;
  @Input() previewUrl = '';
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
  @Output() closePreview = new EventEmitter<void>();

  adminNotes = '';
  img = resolveAdminImg;

  ngOnChanges(): void {
    if (this.reviewing) {
      this.adminNotes = this.reviewing.admin_notes || '';
    }
  }

  decide(status: string) {
    if (!this.reviewing) return;
    this.admin.updatePaymentRequest(this.reviewing.id, status, this.adminNotes).subscribe({
      next: () => { this.toast.success('تم تحديث الطلب'); this.saved.emit(); }
    });
  }
}

