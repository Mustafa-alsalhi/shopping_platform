import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-about-us-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
        <div class="flex justify-between items-center border-b pb-2">
          <h3 class="font-extrabold">{{ editing ? 'تعديل من نحن' : 'إضافة من نحن' }}</h3>
          <button type="button" (click)="close.emit()">✕</button>
        </div>
        <div><label class="text-xs font-bold block mb-1">العنوان *</label><input class="input" [(ngModel)]="m.title" name="title" required /></div>
        <div><label class="text-xs font-bold block mb-1">الوصف *</label><textarea class="input" rows="3" [(ngModel)]="m.description" name="description"></textarea></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><label class="text-xs font-bold block mb-1">الرسالة</label><textarea class="input" rows="2" [(ngModel)]="m.mission" name="mission"></textarea></div>
          <div><label class="text-xs font-bold block mb-1">الرؤية</label><textarea class="input" rows="2" [(ngModel)]="m.vision" name="vision"></textarea></div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><label class="text-xs font-bold block mb-1">البريد</label><input class="input" [(ngModel)]="m.email" name="email" /></div>
          <div><label class="text-xs font-bold block mb-1">الهاتف</label><input class="input" [(ngModel)]="m.phone" name="phone" /></div>
          <div><label class="text-xs font-bold block mb-1">العنوان</label><input class="input" [(ngModel)]="m.address" name="address" /></div>
        </div>
        <div>
          <label class="text-xs font-bold block mb-1">صورة</label>
          <input type="file" accept="image/*" (change)="onFile($event)" class="text-xs" />
          @if (preview() || m.image) { <img [src]="preview() || img(m.image)" class="h-24 mt-2 rounded-lg border object-cover" /> }
        </div>
        <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="m.is_active" name="is_active" /> مفعّلة</label>
        <div class="flex gap-3 pt-2">
          <button class="btn btn-primary">حفظ</button>
          <button type="button" (click)="close.emit()" class="btn btn-outline">إلغاء</button>
        </div>
      </form>
    </div>
  `
})
export class AdminAboutUsModalComponent implements OnInit {
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
    this.file = null;
    this.preview.set('');
    this.m = this.editing
      ? { ...this.editing }
      : { title: '', description: '', mission: '', vision: '', email: '', phone: '', address: '', is_active: true };
  }

  onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.file = f;
    this.preview.set(URL.createObjectURL(f));
  }

  save() {
    const fd = new FormData();
    ['title', 'description', 'mission', 'vision', 'email', 'phone', 'address'].forEach(k => {
      if (this.m[k] !== undefined && this.m[k] !== null) fd.append(k, String(this.m[k]));
    });
    fd.append('is_active', String(!!this.m.is_active));
    if (this.file) fd.append('image', this.file);

    this.admin.saveAboutUs(this.editing?.id || null, fd).subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.saved.emit(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }
}
