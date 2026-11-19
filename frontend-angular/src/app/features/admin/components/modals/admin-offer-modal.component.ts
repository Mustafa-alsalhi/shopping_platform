import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-offer-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-4">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="font-extrabold">{{ editing ? 'تعديل العرض' : 'إضافة عرض جديد' }}</h3>
          <button type="button" (click)="close.emit()">✕</button>
        </div>
        <div><label class="text-xs font-bold block mb-1">عنوان العرض *</label><input class="input" [(ngModel)]="m.title" name="title" required /></div>
        <div><label class="text-xs font-bold block mb-1">الوصف</label><textarea class="input" rows="2" [(ngModel)]="m.description" name="description"></textarea></div>
        <div class="grid grid-cols-3 gap-3">
          <div><label class="text-xs font-bold block mb-1">نسبة الخصم % *</label><input type="number" class="input" [(ngModel)]="m.discount_percentage" name="discount_percentage" required /></div>
          <div><label class="text-xs font-bold block mb-1">السعر الأصلي</label><input type="number" step="0.01" class="input" [(ngModel)]="m.original_price" name="original_price" /></div>
          <div><label class="text-xs font-bold block mb-1">سعر العرض</label><input type="number" step="0.01" class="input" [(ngModel)]="m.discount_price" name="discount_price" /></div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-bold block mb-1">الفئة</label>
            <select class="input" [(ngModel)]="m.category" name="category">
              <option value="special-deals">عروض خاصة</option>
              <option value="flash-sale">تخفيضات سريعة</option>
              <option value="seasonal">عروض موسمية</option>
              <option value="weekend">عروض نهاية الأسبوع</option>
            </select>
          </div>
          <div><label class="text-xs font-bold block mb-1">صالح حتى</label><input type="date" class="input" [(ngModel)]="m.valid_until" name="valid_until" /></div>
        </div>
        <div>
          <label class="text-xs font-bold block mb-1">صورة العرض</label>
          <input type="file" accept="image/*" (change)="onFile($event)" class="text-xs" />
          @if (preview() || m.image) { <img [src]="preview() || img(m.image)" class="h-24 mt-2 rounded-lg border object-cover" /> }
        </div>
        <div class="flex flex-wrap gap-5 text-sm font-bold">
          <label class="flex items-center gap-2"><input type="checkbox" [(ngModel)]="m.active" name="active" /> نشط</label>
          <label class="flex items-center gap-2"><input type="checkbox" [(ngModel)]="m.featured" name="featured" /> مميز</label>
          <label class="flex items-center gap-2"><input type="checkbox" [(ngModel)]="m.limited_time" name="limited_time" /> لفترة محدودة</label>
        </div>
        <div class="flex gap-3 pt-2">
          <button class="btn btn-primary">حفظ</button>
          <button type="button" (click)="close.emit()" class="btn btn-outline">إلغاء</button>
        </div>
      </form>
    </div>
  `
})
export class AdminOfferModalComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  @Input() editing: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  readonly preview = signal('');
  file: File | null = null;
  m: any = {};
  img = resolveAdminImg;

  ngOnInit(): void {
    this.m = this.editing
      ? { ...this.editing, valid_until: this.editing.valid_until ? String(this.editing.valid_until).slice(0, 10) : '' }
      : { title: '', description: '', discount_percentage: 20, original_price: null, discount_price: null, category: 'special-deals', valid_until: '', featured: false, limited_time: false, active: true };
  }

  onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.file = f;
    this.preview.set(URL.createObjectURL(f));
  }

  save() {
    const fd = new FormData();
    fd.append('Title', this.m.title || '');
    fd.append('Description', this.m.description || '');
    fd.append('DiscountPercentage', String(this.m.discount_percentage ?? 0));
    if (this.m.original_price) fd.append('OriginalPrice', String(this.m.original_price));
    if (this.m.discount_price) fd.append('DiscountPrice', String(this.m.discount_price));
    fd.append('Category', this.m.category || 'special-deals');
    if (this.m.valid_until) fd.append('ValidUntil', this.m.valid_until);
    fd.append('Featured', String(!!this.m.featured));
    fd.append('LimitedTime', String(!!this.m.limited_time));
    fd.append('Active', String(!!this.m.active));
    if (this.file) fd.append('image', this.file);

    const req = this.editing ? this.admin.updateOffer(this.editing.id, fd) : this.admin.createOffer(fd);
    req.subscribe({
      next: () => { this.toast.success('تم حفظ العرض'); this.saved.emit(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }
}

