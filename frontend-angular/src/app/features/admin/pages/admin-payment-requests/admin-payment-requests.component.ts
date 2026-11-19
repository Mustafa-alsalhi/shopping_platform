import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';
import { resolveAdminImg } from '../../../../shared/utils/image.utils';
import { AdminPaymentRequestModalComponent } from '../../components/modals/admin-payment-request-modal.component';

@Component({
  selector: 'app-admin-payment-requests',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminPaymentRequestModalComponent],
  template: `
    <div class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-extrabold">طلبات تأكيد الدفع</h1>
          <p class="text-xs text-gray-500">مراجعة الحوالات وإيصالات الدفع واعتمادها</p>
        </div>
        <select class="input w-44" [(ngModel)]="statusFilter" (ngModelChange)="load()">
          <option value="">كل الحالات</option>
          <option value="pending">قيد المراجعة</option>
          <option value="approved">مقبول</option>
          <option value="rejected">مرفوض</option>
        </select>
      </div>

      @if (stats(); as s) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="card p-3.5"><p class="text-xs text-gray-500">الإجمالي</p><p class="text-xl font-extrabold">{{ s.total_requests ?? requests().length }}</p></div>
          <div class="card p-3.5"><p class="text-xs text-gray-500">قيد المراجعة</p><p class="text-xl font-extrabold text-amber-700">{{ s.pending_requests ?? 0 }}</p></div>
          <div class="card p-3.5"><p class="text-xs text-gray-500">المقبولة</p><p class="text-xl font-extrabold text-emerald-700">{{ s.approved_requests ?? 0 }}</p></div>
          <div class="card p-3.5"><p class="text-xs text-gray-500">المرفوضة</p><p class="text-xl font-extrabold text-rose-600">{{ s.rejected_requests ?? 0 }}</p></div>
        </div>
      }

      <div class="card overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-amber-50 text-xs">
            <tr><th class="p-3">الطلب</th><th class="p-3">المرسل</th><th class="p-3">رقم المرجع</th><th class="p-3">المبلغ</th><th class="p-3">الإيصال</th><th class="p-3">الحالة</th><th class="p-3">إجراءات</th></tr>
          </thead>
          <tbody>
            @for (r of requests(); track r.id) {
              <tr class="border-t border-amber-100 text-center">
                <td class="p-3 font-bold">#{{ r.order?.order_number || r.order_id }}</td>
                <td>{{ r.payer_name || r.user?.name }}</td>
                <td class="font-mono text-xs">{{ r.reference_number || '—' }}</td>
                <td class="font-bold">{{ r.payment_amount | number:'1.0-2' }}</td>
                <td>
                  @if (r.receipt_image || r.payment_proof) {
                    <button (click)="previewUrl.set(img(r.receipt_image || r.payment_proof))" class="text-amber-700 font-bold text-xs underline">عرض الإيصال</button>
                  } @else { — }
                </td>
                <td>
                  <span class="badge" [class]="r.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : r.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-800'">
                    {{ r.status === 'approved' ? 'مقبول' : r.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة' }}
                  </span>
                </td>
                <td class="space-x-2 space-x-reverse whitespace-nowrap">
                  <button (click)="openReview(r)" class="btn btn-outline text-xs py-1 px-2">مراجعة</button>
                  <button (click)="remove(r)" class="text-rose-600 text-xs">حذف</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7" class="p-8 text-center text-gray-500">لا توجد طلبات دفع.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <app-admin-payment-request-modal
        [reviewing]="reviewing()"
        [previewUrl]="previewUrl()"
        (close)="reviewing.set(null)"
        (saved)="reviewing.set(null); load()"
        (closePreview)="previewUrl.set('')" />
    </div>
  `
})
export class AdminPaymentRequestsComponent implements OnInit {
  private readonly admin = inject(AdminService);

  readonly requests = signal<any[]>([]);
  readonly stats = signal<any>(null);
  readonly reviewing = signal<any>(null);
  readonly previewUrl = signal('');
  statusFilter = '';
  img = resolveAdminImg;

  ngOnInit(): void { this.load(); }

  load() {
    this.admin.getPaymentRequests(this.statusFilter).subscribe({ next: (r) => this.requests.set(Array.isArray(r) ? r : r?.data || []) });
    this.admin.getPaymentRequestStats().subscribe({ next: (r) => this.stats.set(r?.data || r) });
  }

  openReview(r: any) { this.reviewing.set(r); }

  remove(r: any) { if (confirm('حذف سجل الطلب؟')) this.admin.deletePaymentRequest(r.id).subscribe({ next: () => this.load() }); }
}
