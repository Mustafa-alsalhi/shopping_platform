import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';
import { AdminContactUsModalComponent } from '../../components/modals/admin-contact-us-modal.component';

@Component({
  selector: 'app-admin-contact-us',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminContactUsModalComponent],
  template: `
    <div class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-extrabold">رسائل تواصل معنا</h1>
          <p class="text-xs text-gray-500">متابعة استفسارات وشكاوى العملاء والرد عليها</p>
        </div>
        <select class="input w-44" [(ngModel)]="statusFilter" (ngModelChange)="load()">
          <option value="">كل الرسائل</option>
          <option value="pending">جديدة</option>
          <option value="read">مقروءة</option>
          <option value="replied">تم الرد</option>
          <option value="closed">مغلقة</option>
        </select>
      </div>

      @if (stats(); as s) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="card p-3.5"><p class="text-xs text-gray-500">الإجمالي</p><p class="text-xl font-extrabold">{{ s.total ?? messages().length }}</p></div>
          <div class="card p-3.5"><p class="text-xs text-gray-500">جديدة</p><p class="text-xl font-extrabold text-amber-700">{{ s.pending ?? 0 }}</p></div>
          <div class="card p-3.5"><p class="text-xs text-gray-500">تم الرد</p><p class="text-xl font-extrabold text-emerald-700">{{ s.replied ?? 0 }}</p></div>
          <div class="card p-3.5"><p class="text-xs text-gray-500">مغلقة</p><p class="text-xl font-extrabold text-gray-600">{{ s.closed ?? 0 }}</p></div>
        </div>
      }

      <div class="card overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-amber-50 text-xs">
            <tr><th class="p-3">المرسل</th><th class="p-3">التواصل</th><th class="p-3">الموضوع</th><th class="p-3">الحالة</th><th class="p-3">إجراءات</th></tr>
          </thead>
          <tbody>
            @for (msg of messages(); track msg.id) {
              <tr class="border-t border-amber-100 text-center">
                <td class="p-3 font-bold">{{ msg.name }}</td>
                <td class="text-xs">{{ msg.email }}<br />{{ msg.phone }}</td>
                <td>{{ msg.subject }}</td>
                <td>
                  <span class="badge" [class]="msg.status === 'replied' ? 'bg-emerald-100 text-emerald-800' : msg.status === 'closed' ? 'bg-gray-200 text-gray-600' : 'bg-amber-100 text-amber-800'">
                    {{ statusLabel(msg.status) }}
                  </span>
                </td>
                <td class="space-x-2 space-x-reverse">
                  <button (click)="openReply(msg)" class="text-amber-700 font-bold text-xs">عرض / رد</button>
                  <button (click)="remove(msg)" class="text-rose-600 text-xs">حذف</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5" class="p-8 text-center text-gray-500">لا توجد رسائل.</td></tr>
            }
          </tbody>
        </table>
      </div>

      @if (replyRow(); as r) {
        <app-admin-contact-us-modal [message]="r" (close)="replyRow.set(null)" (saved)="replyRow.set(null); load()" />
      }
    </div>
  `
})
export class AdminContactUsComponent implements OnInit {
  private readonly admin = inject(AdminService);

  readonly messages = signal<any[]>([]);
  readonly stats = signal<any>(null);
  readonly replyRow = signal<any>(null);
  statusFilter = '';

  ngOnInit(): void { this.load(); }

  statusLabel(s: string) {
    return ({ pending: 'جديدة', read: 'مقروءة', replied: 'تم الرد', closed: 'مغلقة' } as Record<string, string>)[s] || s;
  }

  load() {
    this.admin.getContactMessages(this.statusFilter).subscribe({ next: (r) => this.messages.set(Array.isArray(r) ? r : r?.data || []) });
    this.admin.getContactStats().subscribe({ next: (r) => this.stats.set(r?.data || r) });
  }

  openReply(row: any) { this.replyRow.set(row); }

  remove(m: any) { if (confirm('حذف الرسالة؟')) this.admin.deleteContactMessage(m.id).subscribe({ next: () => this.load() }); }
}
