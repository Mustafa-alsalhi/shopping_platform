import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';

@Component({
  selector: 'app-admin-contact-us',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl p-6 w-full max-w-lg space-y-3">
            <div class="flex justify-between items-center border-b pb-2"><h3 class="font-extrabold">{{ r.subject }}</h3><button (click)="replyRow.set(null)">✕</button></div>
            <p class="text-xs text-gray-500">{{ r.name }} — {{ r.email }} — {{ r.phone }}</p>
            <p class="text-sm bg-amber-50 rounded-xl p-3 whitespace-pre-line">{{ r.message }}</p>
            <textarea class="input" rows="3" [(ngModel)]="replyText" placeholder="اكتب ردك للعميل..."></textarea>
            <div class="flex flex-wrap gap-2">
              <button (click)="sendReply('replied')" class="btn btn-primary text-xs">إرسال الرد</button>
              <button (click)="sendReply('read')" class="btn btn-outline text-xs">تعليم كمقروء</button>
              <button (click)="sendReply('closed')" class="btn btn-outline text-xs">إغلاق</button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminContactUsComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly messages = signal<any[]>([]);
  readonly stats = signal<any>(null);
  readonly replyRow = signal<any>(null);
  statusFilter = '';
  replyText = '';

  ngOnInit(): void { this.load(); }

  statusLabel(s: string) {
    return ({ pending: 'جديدة', read: 'مقروءة', replied: 'تم الرد', closed: 'مغلقة' } as Record<string, string>)[s] || s;
  }

  load() {
    this.admin.getContactMessages(this.statusFilter).subscribe({ next: (r) => this.messages.set(Array.isArray(r) ? r : r?.data || []) });
    this.admin.getContactStats().subscribe({ next: (r) => this.stats.set(r?.data || r) });
  }

  openReply(row: any) { this.replyRow.set(row); this.replyText = row.admin_reply || ''; }

  sendReply(status: string) {
    const r = this.replyRow();
    if (!r) return;
    this.admin.replyContactMessage(r.id, status, this.replyText).subscribe({
      next: () => { this.toast.success('تم تحديث الرسالة'); this.replyRow.set(null); this.load(); }
    });
  }

  remove(m: any) { if (confirm('حذف الرسالة؟')) this.admin.deleteContactMessage(m.id).subscribe({ next: () => this.load() }); }
}
