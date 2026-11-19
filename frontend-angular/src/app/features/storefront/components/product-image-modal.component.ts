import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-image-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
        <div class="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto text-2xl">⚠️</div>
        <h3 class="text-lg font-extrabold text-gray-900">تأكيد بدء طلب جديد</h3>
        <p class="text-sm text-gray-600 leading-relaxed">{{ message }}</p>
        <div class="flex gap-3 pt-2">
          <button type="button" (click)="confirm.emit()" class="btn btn-primary flex-1 py-2.5 font-bold">
            نعم، إفراغ السلة والإضافة
          </button>
          <button type="button" (click)="cancel.emit()" class="btn btn-outline flex-1 py-2.5 font-semibold">
            إلغاء
          </button>
        </div>
      </div>
    </div>
  `
})
export class ProductImageModalComponent {
  @Input() message: string | null = null;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}

