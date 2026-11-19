import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-activity-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="font-extrabold">{{ editing ? 'تعديل النشاط' : 'إضافة نشاط جديد' }}</h3>
          <button type="button" (click)="close.emit()">✕</button>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="text-xs font-bold block mb-1">اسم النشاط *</label><input class="input" [(ngModel)]="m.name" name="name" required /></div>
          <div><label class="text-xs font-bold block mb-1">المعرف (Slug)</label><input class="input" [(ngModel)]="m.slug" name="slug" placeholder="مثال: pharmacy" /></div>
        </div>
        <div>
          <label class="text-xs font-bold block mb-1">الأيقونة</label>
          <div class="flex gap-2 items-center">
            <input class="input w-24 text-center text-xl" [(ngModel)]="m.icon" name="icon" />
            <div class="flex flex-wrap gap-1">
              @for (ic of iconPresets; track ic) {
                <button type="button" (click)="m.icon = ic" class="px-2 py-1 rounded border hover:bg-amber-50">{{ ic }}</button>
              }
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-bold block mb-1">لون الواجهة</label>
            <div class="flex gap-2 items-center">
              <input type="color" [(ngModel)]="m.theme_color" name="theme_color" class="w-10 h-9 rounded border cursor-pointer" />
              <input class="input text-xs" [(ngModel)]="m.theme_color" name="theme_color_hex" />
            </div>
          </div>
          <div><label class="text-xs font-bold block mb-1">الترتيب</label><input type="number" class="input" [(ngModel)]="m.sort_order" name="sort_order" /></div>
        </div>
        <div><label class="text-xs font-bold block mb-1">الوصف</label><textarea class="input" rows="2" [(ngModel)]="m.description" name="description"></textarea></div>
        <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="m.is_active" name="is_active" /> نشاط مفعّل</label>
        <div class="flex gap-3 pt-2">
          <button class="btn btn-primary">حفظ</button>
          <button type="button" (click)="close.emit()" class="btn btn-outline">إلغاء</button>
        </div>
      </form>
    </div>
  `
})
export class AdminActivityModalComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  @Input() editing: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  iconPresets = ['🛍️', '🍔', '💊', '🛒', '💐', '📱', '☕', '🎁', '🍰', '🐾'];
  m: any = {};

  ngOnInit(): void {
    this.m = this.editing
      ? { ...this.editing }
      : { name: '', slug: '', icon: '🛍️', description: '', sort_order: 0, theme_color: '#d97706', is_active: true };
  }

  save() {
    const req = this.editing ? this.admin.updateActivity(this.editing.id, this.m) : this.admin.createActivity(this.m);
    req.subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.saved.emit(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }
}
