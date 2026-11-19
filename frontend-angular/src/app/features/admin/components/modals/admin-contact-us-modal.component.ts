import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-contact-us-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (message; as r) {
      <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl p-6 w-full max-w-lg space-y-3">
          <div class="flex justify-between items-center border-b pb-2"><h3 class="font-extrabold">{{ r.subject }}</h3><button (click)="close.emit()">✕</button></div>
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
  `
})
export class AdminContactUsModalComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  @Input() message: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  replyText = '';

  ngOnInit(): void {
    this.replyText = this.message?.admin_reply || '';
  }

  sendReply(status: string) {
    if (!this.message) return;
    this.admin.replyContactMessage(this.message.id, status, this.replyText).subscribe({
      next: () => { this.toast.success('تم تحديث الرسالة'); this.saved.emit(); }
    });
  }
}

