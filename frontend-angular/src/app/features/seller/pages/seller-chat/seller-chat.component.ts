import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerService } from '../../../../core/services/seller.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-seller-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-extrabold">رسائل العملاء</h1>
          <p class="text-xs text-gray-500">الرد على استفسارات العملاء ومتابعة المحادثات</p>
        </div>
        <select class="input w-40" [(ngModel)]="statusFilter" (ngModelChange)="load()">
          <option value="">كل الرسائل</option><option value="unread">غير مقروءة</option><option value="replied">تم الرد</option><option value="archived">مؤرشفة</option>
        </select>
      </div>

      <div class="space-y-3">
        @for (m of messages(); track m.id) {
          <div class="card p-4 space-y-2">
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="font-extrabold">{{ m.sender?.name || m.user?.name || 'عميل' }} <span class="text-xs text-gray-400">{{ m.created_at | date:'short' }}</span></p>
                <p class="text-sm text-gray-800 mt-1">{{ m.message }}</p>
              </div>
              <div class="flex gap-2 text-xs shrink-0">
                @if (!m.is_read) { <button (click)="markRead(m)" class="text-amber-700 font-bold">مقروء</button> }
                <button (click)="archive(m)" class="text-gray-500">أرشفة</button>
                <button (click)="remove(m)" class="text-rose-600">حذف</button>
              </div>
            </div>
            @if (m.reply) {
              <p class="text-xs bg-emerald-50 text-emerald-800 p-2 rounded-lg"><b>ردك:</b> {{ m.reply }}</p>
            }
            <div class="flex gap-2 pt-1">
              <input class="input flex-1 text-xs" [(ngModel)]="replies[m.id]" placeholder="اكتب ردك هنا..." />
              <button (click)="sendReply(m)" class="btn btn-primary text-xs py-1.5 px-3">إرسال</button>
            </div>
          </div>
        } @empty { <div class="card p-10 text-center text-gray-500">لا توجد رسائل.</div> }
      </div>
    </div>
  `
})
export class SellerChatComponent implements OnInit {
  private readonly seller = inject(SellerService);
  private readonly toast = inject(ToastService);
  readonly messages = signal<any[]>([]);
  statusFilter = '';
  replies: Record<number, string> = {};

  ngOnInit(): void { this.load(); }
  load() { this.seller.getMessages(this.statusFilter).subscribe({ next: (r) => this.messages.set(r?.data || r || []) }); }

  sendReply(m: any) {
    const txt = (this.replies[m.id] || '').trim();
    if (!txt) return;
    this.seller.replyMessage(m.id, txt).subscribe({
      next: () => { this.toast.success('تم إرسال الرد'); this.replies[m.id] = ''; this.load(); }
    });
  }
  markRead(m: any) { this.seller.markMessageRead(m.id).subscribe({ next: () => this.load() }); }
  archive(m: any) { this.seller.archiveMessage(m.id).subscribe({ next: () => this.load() }); }
  remove(m: any) { if (confirm('حذف الرسالة؟')) this.seller.deleteMessage(m.id).subscribe({ next: () => this.load() }); }
}
