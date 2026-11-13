import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { environment } from '../../../../../environments/environment';
import { ORDER_STATUS_LABELS } from '../../../../shared/constants/order-status';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-extrabold">إدارة المستخدمين</h1>
          <p class="text-xs text-gray-500">إضافة وتعديل حسابات العملاء والبائعين والمندوبين والمديرين</p>
        </div>
        <button (click)="openForm(null)" class="btn btn-primary text-sm">+ إضافة مستخدم</button>
      </div>

      <div class="card p-3 flex flex-wrap gap-3">
        <input class="input flex-1 min-w-[200px]" [(ngModel)]="search" (ngModelChange)="load()" placeholder="ابحث بالاسم أو الجوال أو البريد..." />
        <select class="input w-40" [(ngModel)]="role" (ngModelChange)="load()">
          <option value="">كل الأدوار</option><option value="customer">عميل</option><option value="seller">بائع</option><option value="driver">مندوب</option><option value="admin">مدير</option>
        </select>
      </div>

      <div class="card overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-amber-50 text-xs"><tr><th class="p-3">الاسم</th><th class="p-3">الجوال</th><th class="p-3">البريد</th><th class="p-3">الدور</th><th class="p-3">الحالة</th><th class="p-3">إجراءات</th></tr></thead>
          <tbody>
            @for (u of users(); track u.id) {
              <tr class="border-t border-amber-100 text-center">
                <td class="p-3 font-bold">{{ u.name }}</td><td>{{ u.phone || '—' }}</td><td>{{ u.email }}</td>
                <td><select class="input w-28 text-xs" [ngModel]="u.role" (ngModelChange)="quickUpdate(u, { role: $event })">
                  <option value="customer">عميل</option><option value="seller">بائع</option><option value="driver">مندوب</option><option value="admin">مدير</option></select></td>
                <td><button (click)="quickUpdate(u, { is_active: !u.is_active })" class="badge cursor-pointer" [class]="u.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'">{{ u.is_active ? 'نشط' : 'موقوف' }}</button></td>
                <td class="space-x-2 space-x-reverse">
                  <button (click)="openForm(u)" class="text-blue-700 font-bold text-xs">تعديل</button>
                  <button (click)="remove(u.id)" class="text-rose-600 text-xs">حذف</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="p-8 text-center text-gray-500">لا يوجد مستخدمون.</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (showForm()) {
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form (ngSubmit)="save()" class="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4">
            <div class="flex justify-between items-center border-b pb-2">
              <h3 class="font-extrabold">{{ editing() ? 'تعديل المستخدم' : 'إضافة مستخدم جديد' }}</h3>
              <button type="button" (click)="showForm.set(false)">✕</button>
            </div>
            <div><label class="text-xs font-bold block mb-1">الاسم *</label><input class="input" [(ngModel)]="m.name" name="name" required /></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="text-xs font-bold block mb-1">البريد الإلكتروني *</label><input type="email" class="input" [(ngModel)]="m.email" name="email" required /></div>
              <div><label class="text-xs font-bold block mb-1">الجوال</label><input class="input" [(ngModel)]="m.phone" name="phone" /></div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-bold block mb-1">كلمة المرور {{ editing() ? '(اختياري للتغيير)' : '*' }}</label>
                <input type="password" class="input" [(ngModel)]="m.password" name="password" [required]="!editing()" />
              </div>
              <div>
                <label class="text-xs font-bold block mb-1">الدور</label>
                <select class="input" [(ngModel)]="m.role" name="role">
                  <option value="customer">عميل</option><option value="seller">بائع</option><option value="driver">مندوب</option><option value="admin">مدير</option>
                </select>
              </div>
            </div>
            <label class="flex items-center gap-2 text-sm font-bold"><input type="checkbox" [(ngModel)]="m.is_active" name="is_active" /> الحساب نشط</label>
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
export class AdminUsersComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  readonly users = signal<any[]>([]);
  readonly showForm = signal(false);
  readonly editing = signal<any>(null);
  search = ''; role = '';
  m: any = {};

  ngOnInit(): void { this.load(); }
  load() { this.admin.getUsers(this.role, this.search).subscribe({ next: (u) => this.users.set(u || []) }); }

  openForm(u: any | null) {
    this.editing.set(u);
    this.m = u ? { name: u.name, email: u.email, phone: u.phone || '', password: '', role: u.role || 'customer', is_active: !!u.is_active }
      : { name: '', email: '', phone: '', password: '', role: 'customer', is_active: true };
    this.showForm.set(true);
  }

  save() {
    const u = this.editing();
    const payload = { ...this.m };
    if (u && !payload.password) delete payload.password;
    const req = u ? this.admin.updateUser(u.id, payload) : this.admin.createUser(payload);
    req.subscribe({
      next: () => { this.toast.success('تم الحفظ'); this.showForm.set(false); this.load(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الحفظ')
    });
  }

  quickUpdate(u: any, patch: any) { this.admin.updateUser(u.id, { name: u.name, email: u.email, ...patch }).subscribe({ next: () => this.load() }); }
  remove(id: number) { if (confirm('حذف المستخدم؟')) this.admin.deleteUser(id).subscribe(() => this.load()); }
}
