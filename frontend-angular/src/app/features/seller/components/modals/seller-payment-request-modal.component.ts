import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-seller-payment-request-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4" dir="rtl" (click)="closed.emit()">
      <img [src]="previewUrl()" class="max-h-[85vh] max-w-full rounded-2xl shadow-2xl" />
    </div>
  `
})
export class SellerPaymentRequestModalComponent {
  readonly previewUrl = input.required<string>();
  readonly closed = output<void>();
}
