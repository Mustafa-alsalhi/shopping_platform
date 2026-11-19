import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-seller-offer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl">
      <form (ngSubmit)="saved.emit()" class="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="font-extrabold">{{ isEditing() ? 'تعديل العرض' : 'إضافة عرض جديد' }}</h3>
          <button type="button" (click)="closed.emit()">✕</button>
        </div>
        <div><label class="text-xs font-bold block mb-1">عنوان العرض *</label><input class="input" [(ngModel)]="model().title" name="title" required /></div>
        <div><label class="text-xs font-bold block mb-1">الوصف</label><textarea class="input" rows="2" [(ngModel)]="model().description" name="description"></textarea></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-bold block mb-1">نسبة الخصم % *</label><input type="number" class="input" [(ngModel)]="model().discount_percentage" name="discount" required /></div>
          <div><label class="text-xs font-bold block mb-1">صالح حتى</label><input type="date" class="input" [(ngModel)]="model().valid_until" name="valid_until" /></div>
        </div>
        <div>
          <label class="text-xs font-bold block mb-1">صورة العرض</label>
          <input type="file" accept="image/*" (change)="fileSelected.emit($event)" class="text-xs" />
          @if (preview() || model().image) { <img [src]="preview() || img(model().image)" class="h-24 mt-2 rounded-lg border object-cover" /> }
        </div>
        <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="model().active" name="active" /> عرض نشط</label>
        <div class="flex gap-3 pt-2">
          <button class="btn btn-primary">حفظ</button>
          <button type="button" (click)="closed.emit()" class="btn btn-outline">إلغاء</button>
        </div>
      </form>
    </div>
  `
})
export class SellerOfferModalComponent {
  readonly isEditing = input<boolean>(false);
  readonly model = input.required<any>();
  readonly preview = input<string>('');
  readonly fileSelected = output<Event>();
  readonly saved = output<void>();
  readonly closed = output<void>();
  img = resolveAdminImg;
}

@Component({
  selector: 'app-seller-offer-products-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl">
      <div class="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[85vh] overflow-y-auto space-y-4">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="font-extrabold">منتجات العرض: {{ offer().title }}</h3>
          <button (click)="closed.emit()">✕</button>
        </div>
        <div class="flex gap-2">
          <select class="input flex-1" [(ngModel)]="selectedPid">
            <option [ngValue]="null">اختر منتجاً...</option>
            @for (p of allProducts(); track p.id) { <option [ngValue]="p.id">{{ p.name }} — {{ p.price }}</option> }
          </select>
          <button (click)="onAttach()" class="btn btn-primary text-xs">إضافة</button>
        </div>
        @for (p of offerProducts(); track p.id) {
          <div class="flex justify-between items-center p-2 border rounded-xl text-sm">
            <span class="font-bold">{{ p.name }}</span>
            <button (click)="detached.emit(p.id)" class="text-rose-600 text-xs">إزالة</button>
          </div>
        } @empty { <p class="text-center text-gray-500 py-4 text-sm">لا توجد منتجات مرتبطة.</p> }
      </div>
    </div>
  `
})
export class SellerOfferProductsModalComponent {
  readonly offer = input.required<any>();
  readonly allProducts = input<any[]>([]);
  readonly offerProducts = input<any[]>([]);
  readonly attached = output<number>();
  readonly detached = output<number>();
  readonly closed = output<void>();
  selectedPid: number | null = null;

  onAttach(): void {
    if (!this.selectedPid) return;
    this.attached.emit(this.selectedPid);
    this.selectedPid = null;
  }
}
