import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-seller-category-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" dir="rtl">
      <form (ngSubmit)="saved.emit()" class="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="font-extrabold">{{ isEditing() ? 'تعديل القسم' : 'إضافة قسم جديد' }}</h3>
          <button type="button" (click)="closed.emit()">✕</button>
        </div>
        <div><label class="text-xs font-bold block mb-1">اسم القسم *</label><input class="input" [(ngModel)]="model().name" name="name" required /></div>
        <div><label class="text-xs font-bold block mb-1">الوصف</label><textarea class="input" rows="2" [(ngModel)]="model().description" name="description"></textarea></div>
        <div><label class="text-xs font-bold block mb-1">الترتيب</label><input type="number" class="input" [(ngModel)]="model().sort_order" name="sort_order" /></div>
        <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="model().is_active" name="is_active" /> مفعّل</label>
        <div class="flex gap-3 pt-2">
          <button class="btn btn-primary">حفظ</button>
          <button type="button" (click)="closed.emit()" class="btn btn-outline">إلغاء</button>
        </div>
      </form>
    </div>
  `
})
export class SellerCategoryModalComponent {
  readonly isEditing = input<boolean>(false);
  readonly model = input.required<any>();
  readonly saved = output<void>();
  readonly closed = output<void>();
}
