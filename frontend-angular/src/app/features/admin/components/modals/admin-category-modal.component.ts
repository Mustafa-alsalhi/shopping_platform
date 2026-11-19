import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-category-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
        <div class="flex justify-between items-center border-b border-amber-100 pb-2">
          <h3 class="font-extrabold">{{ editing ? 'تعديل القسم' : 'إضافة قسم جديد' }}</h3>
          <button type="button" (click)="close.emit()">✕</button>
        </div>
        <div><label class="text-xs font-bold block mb-1">اسم القسم *</label><input class="input" [(ngModel)]="m.name" name="name" required /></div>
        <div><label class="text-xs font-bold block mb-1">المعرف (Slug)</label><input class="input" [(ngModel)]="m.slug" name="slug" placeholder="يُنشأ تلقائياً إذا تُرك فارغاً" /></div>
        <div>
          <label class="text-xs font-bold block mb-1">النشاط التابع له</label>
          <select class="input" [(ngModel)]="m.type" name="type">
            <option value="store">متاجر (store)</option>
            <option value="restaurant">مطاعم (restaurant)</option>
            @for (a of activities; track a.id) {
              @if (a.slug !== 'store' && a.slug !== 'restaurant') {
                <option [value]="a.slug">{{ a.name }} ({{ a.slug }})</option>
              }
            }
          </select>
        </div>
        <div><label class="text-xs font-bold block mb-1">الوصف</label><textarea class="input" rows="2" [(ngModel)]="m.description" name="description"></textarea></div>
        <div>
          <label class="text-xs font-bold block mb-1">صورة القسم</label>
          <input type="file" accept="image/*" (change)="upload($event)" class="text-xs" />
          <input class="input mt-2 text-xs" [(ngModel)]="m.image" name="image" placeholder="أو رابط الصورة" />
          @if (m.image) { <img [src]="img(m.image)" class="h-16 mt-2 rounded-lg border object-cover" /> }
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-bold block mb-1">الحالة</label>
            <select class="input" [(ngModel)]="m.status" name="status">
              <option value="active">نشط</option><option value="inactive">غير نشط</option>
            </select>
          </div>
          <div class="flex items-end pb-2">
            <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="m.featured" name="featured" /> يظهر في الرئيسية</label>
          </div>
        </div>
        <div class="flex gap-3 pt-2">
          <button class="btn btn-primary">حفظ</button>
          <button type="button" (click)="close.emit()" class="btn btn-outline">إلغاء</button>
        </div>
      </form>
    </div>
  `
})
export class AdminCategoryModalComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  @Input() editing: any = null;
  @Input() activities: any[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  m: any = {};
  img = resolveAdminImg;

  ngOnInit(): void {
    this.m = this.editing
      ? { ...this.editing }
      : { name: '', slug: '', type: 'store', description: '', image: '', status: 'active', featured: false };
  }

  upload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.admin.uploadCategoryImage(file).subscribe({
      next: (r) => { this.m.image = r.image_url || r.data?.image_url; this.toast.success('تم رفع الصورة'); },
      error: () => this.toast.error('تعذر رفع الصورة')
    });
  }

  save() {
    const req = this.editing ? this.admin.updateCategory(this.editing.id, this.m) : this.admin.createCategory(this.m);
    req.subscribe({
      next: () => { this.toast.success('تم حفظ القسم'); this.saved.emit(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }
}
