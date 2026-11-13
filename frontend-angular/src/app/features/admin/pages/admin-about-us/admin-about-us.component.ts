import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-about-us',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-extrabold">صفحة من نحن</h1>
          <p class="text-xs text-gray-500">إدارة محتوى صفحة التعريف بالمتجر والرسالة والرؤية</p>
        </div>
        <button (click)="openForm(null)" class="btn btn-primary text-sm">+ إضافة قسم تعريفي</button>
      </div>

      <div class="grid grid-cols-1 gap-4">
        @for (a of items(); track a.id) {
          <div class="card p-5 flex flex-col md:flex-row gap-4 justify-between">
            <div class="flex gap-4 items-start">
              @if (a.image) { <img [src]="img(a.image)" class="w-24 h-24 rounded-xl object-cover border shrink-0" /> }
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <h3 class="font-extrabold text-lg">{{ a.title }}</h3>
                  <span class="badge" [class]="a.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'">{{ a.is_active ? 'مفعّل' : 'معطّل' }}</span>
                </div>
                <p class="text-sm text-gray-600">{{ a.description }}</p>
                @if (a.mission) { <p class="text-xs text-gray-500"><b>الرسالة:</b> {{ a.mission }}</p> }
                @if (a.vision) { <p class="text-xs text-gray-500"><b>الرؤية:</b> {{ a.vision }}</p> }
                <p class="text-xs text-amber-800">{{ a.email }} • {{ a.phone }} • {{ a.address }}</p>
              </div>
            </div>
            <div class="flex gap-3 items-start shrink-0 text-xs">
              <button (click)="openForm(a)" class="text-blue-700 font-bold">تعديل</button>
              <button (click)="remove(a)" class="text-rose-600">حذف</button>
            </div>
          </div>
        } @empty {
          <div class="card p-10 text-center text-gray-500">لا يوجد محتوى حالياً.</div>
        }
      </div>

      @if (showForm()) {
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="font-extrabold">{{ editing() ? 'تعديل من نحن' : 'إضافة من نحن' }}</h3>
              <button type="button" (click)="showForm.set(false)">✕</button>
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
              <button type="button" (click)="showForm.set(false)" class="btn btn-outline">إلغاء</button>
            </div>
          </form>
        </div>
      }
    </div>
  `
})
export class AdminAboutUsComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly items = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  readonly preview = signal('');
  file: File | null = null;
  m: any = {};
  img = resolveAdminImg;

  ngOnInit(): void { this.load(); }
  load() { this.admin.getAboutUs().subscribe({ next: (r) => this.items.set(Array.isArray(r) ? r : r?.data || (r?.id ? [r] : [])) }); }

  openForm(row: any | null) {
    this.editing.set(row);
    this.file = null;
    this.preview.set('');
    this.m = row ? { ...row } : { title: '', description: '', mission: '', vision: '', email: '', phone: '', address: '', is_active: true };
    this.showForm.set(true);
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

    this.admin.saveAboutUs(this.editing()?.id || null, fd).subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.showForm.set(false); this.load(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }

  remove(a: any) { if (confirm('حذف المحتوى؟')) this.admin.deleteAboutUs(a.id).subscribe({ next: () => this.load() }); }
}
