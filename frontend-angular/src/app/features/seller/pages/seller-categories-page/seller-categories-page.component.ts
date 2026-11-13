import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerService } from '../../../../core/services/seller.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-seller-categories-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-extrabold">أقسام المتجر الخاصة</h1>
          <p class="text-xs text-gray-500">تنظيم منتجاتك أو قائمة الطعام في أقسام خاصة بمتجرك</p>
        </div>
        <button (click)="openForm(null)" class="btn btn-primary text-sm">+ إضافة قسم</button>
      </div>

      <div class="card overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-amber-50 text-xs">
            <tr><th class="p-3 text-right">اسم القسم</th><th class="p-3">الوصف</th><th class="p-3">الترتيب</th><th class="p-3">الحالة</th><th class="p-3">إجراءات</th></tr>
          </thead>
          <tbody>
            @for (c of categories(); track c.id) {
              <tr class="border-t border-amber-100 text-center">
                <td class="p-3 text-right font-bold">{{ c.name }}</td>
                <td class="text-xs text-gray-500">{{ c.description || '—' }}</td>
                <td>{{ c.sort_order ?? 0 }}</td>
                <td><span class="badge" [class]="c.is_active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'">{{ c.is_active !== false ? 'مفعّل' : 'معطّل' }}</span></td>
                <td class="space-x-2 space-x-reverse">
                  <button (click)="openForm(c)" class="text-blue-700 font-bold text-xs">تعديل</button>
                  <button (click)="remove(c)" class="text-rose-600 text-xs">حذف</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="p-8 text-center text-gray-500">لا توجد أقسام خاصة بعد.</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (showForm()) {
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="font-extrabold">{{ editing() ? 'تعديل القسم' : 'إضافة قسم جديد' }}</h3>
              <button type="button" (click)="showForm.set(false)">✕</button>
            </div>
            <div><label class="text-xs font-bold block mb-1">اسم القسم *</label><input class="input" [(ngModel)]="m.name" name="name" required /></div>
            <div><label class="text-xs font-bold block mb-1">الوصف</label><textarea class="input" rows="2" [(ngModel)]="m.description" name="description"></textarea></div>
            <div><label class="text-xs font-bold block mb-1">الترتيب</label><input type="number" class="input" [(ngModel)]="m.sort_order" name="sort_order" /></div>
            <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="m.is_active" name="is_active" /> مفعّل</label>
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
export class SellerCategoriesPageComponent implements OnInit {
  private readonly seller = inject(SellerService);
  private readonly toast = inject(ToastService);
  readonly categories = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  m: any = {};

  ngOnInit(): void { this.load(); }
  load() { this.seller.getCategories().subscribe({ next: (r) => this.categories.set(r || []) }); }

  openForm(c: any | null) {
    this.editing.set(c);
    this.m = c ? { ...c } : { name: '', description: '', sort_order: 0, is_active: true };
    this.showForm.set(true);
  }

  save() {
    const c = this.editing();
    const req = c ? this.seller.updateCategory(c.id, this.m) : this.seller.createCategory(this.m);
    req.subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.showForm.set(false); this.load(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }

  remove(c: any) { if (confirm(`حذف القسم "${c.name}"؟`)) this.seller.deleteCategory(c.id).subscribe({ next: () => this.load() }); }
}
