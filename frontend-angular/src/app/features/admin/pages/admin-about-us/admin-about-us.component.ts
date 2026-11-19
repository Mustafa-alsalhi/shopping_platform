import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';
import { AdminAboutUsModalComponent } from '../../components/modals/admin-about-us-modal.component';

@Component({
  selector: 'app-admin-about-us',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminAboutUsModalComponent],
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
        <app-admin-about-us-modal [editing]="editing()" (close)="showForm.set(false)" (saved)="showForm.set(false); load()" />
      }
    </div>
  `
})
export class AdminAboutUsComponent implements OnInit {
  private readonly admin = inject(AdminService);

  readonly items = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  img = resolveAdminImg;

  ngOnInit(): void { this.load(); }
  load() { this.admin.getAboutUs().subscribe({ next: (r) => this.items.set(Array.isArray(r) ? r : r?.data || (r?.id ? [r] : [])) }); }

  openForm(row: any | null) {
    this.editing.set(row);
    this.showForm.set(true);
  }

  remove(a: any) { if (confirm('حذف المحتوى؟')) this.admin.deleteAboutUs(a.id).subscribe({ next: () => this.load() }); }
}
