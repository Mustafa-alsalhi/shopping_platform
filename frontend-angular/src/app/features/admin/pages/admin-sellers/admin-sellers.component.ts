import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';
import { AdminSellerModalComponent } from '../../components/modals/admin-seller-modal.component';

@Component({
  selector: 'app-admin-sellers',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminSellerModalComponent],
  template: `
    <div class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-extrabold">البائعون والمطاعم</h1>
          <p class="text-xs text-gray-500">إدارة المتاجر والمطاعم، اعتماد الطلبات، وتعديل البيانات</p>
        </div>
        <button (click)="openForm(null)" class="btn btn-primary text-sm">+ إضافة بائع / متجر</button>
      </div>

      <div class="card p-3 flex flex-wrap gap-3">
        <input class="input flex-1 min-w-[200px]" [(ngModel)]="search" placeholder="ابحث باسم المتجر أو المالك أو الجوال..." />
        <select class="input w-40" [(ngModel)]="typeFilter" (ngModelChange)="load()">
          <option value="">كل الأنشطة</option><option value="store">متجر</option><option value="restaurant">مطعم</option>
        </select>
        <select class="input w-40" [(ngModel)]="status" (ngModelChange)="load()">
          <option value="">كل الحالات</option><option value="pending">بانتظار الموافقة</option><option value="active">نشط</option><option value="suspended">موقوف</option><option value="rejected">مرفوض</option>
        </select>
      </div>

      @for (s of filtered(); track s.id) {
        <div class="card p-4 flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            @if (s.logo) { <img [src]="img(s.logo)" class="w-12 h-12 rounded-xl object-cover border" /> }
            <div>
              <p class="font-extrabold">{{ s.store_name || s.name }}
                <span class="badge bg-slate-100 text-slate-700 mr-1">{{ s.type }}</span>
                @if (s.verified) { <span class="badge bg-blue-100 text-blue-700 mr-1">موثق</span> }
                @if (s.featured) { <span class="badge bg-amber-100 text-amber-800 mr-1">مميز</span> }
              </p>
              <p class="text-xs text-gray-500">{{ s.user?.name }} — {{ s.phone || s.user?.phone }} — {{ s.address || s.city }}</p>
              @if (s.kuraimi_account_number) {
                <p class="text-xs text-gray-500">الكريمي: {{ s.kuraimi_account_name }} / {{ s.kuraimi_account_number }}</p>
              }
            </div>
          </div>
          <div class="flex flex-wrap gap-2 items-center">
            <span class="badge bg-amber-100 text-amber-800">{{ s.status }}</span>
            @if (s.status !== 'active') { <button (click)="setStatus(s, 'active')" class="btn btn-success text-xs py-1 px-2.5">اعتماد</button> }
            @if (s.status === 'active') { <button (click)="setStatus(s, 'suspended')" class="btn btn-outline text-xs py-1 px-2.5">إيقاف</button> }
            @if (s.status === 'pending') { <button (click)="setStatus(s, 'rejected')" class="btn btn-error text-xs py-1 px-2.5">رفض</button> }
            <button (click)="openForm(s)" class="text-blue-700 font-bold text-xs">تعديل</button>
            <button (click)="remove(s.id)" class="text-rose-600 text-xs">حذف</button>
          </div>
        </div>
      } @empty { <div class="card p-10 text-center text-gray-500">لا يوجد بائعون.</div> }

      @if (showForm()) {
        <app-admin-seller-modal [editing]="editing()" [users]="users()" (close)="showForm.set(false)" (saved)="showForm.set(false); load()" />
      }
    </div>
  `
})
export class AdminSellersComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  readonly sellers = signal<any[]>([]);
  readonly users = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  status = ''; typeFilter = ''; search = '';
  img = resolveAdminImg;

  readonly filtered = computed(() => {
    const q = this.search.trim().toLowerCase();
    return this.sellers().filter(s => !q || (s.store_name || s.name || '').toLowerCase().includes(q) || (s.user?.name || '').toLowerCase().includes(q) || (s.phone || '').includes(q));
  });

  ngOnInit(): void {
    this.load();
    this.admin.getUsers().subscribe({ next: (u) => this.users.set(u || []) });
  }
  load() { this.admin.getSellers(this.typeFilter, this.status).subscribe({ next: (s) => this.sellers.set(s || []) }); }

  openForm(s: any | null) {
    this.editing.set(s);
    this.showForm.set(true);
  }

  setStatus(s: any, status: string) { this.admin.updateSeller(s.id, { name: s.name || s.store_name, status }).subscribe({ next: () => { this.toast.success('تم التحديث'); this.load(); } }); }
  remove(id: number) { if (confirm('حذف البائع؟')) this.admin.deleteSeller(id).subscribe(() => this.load()); }
}
