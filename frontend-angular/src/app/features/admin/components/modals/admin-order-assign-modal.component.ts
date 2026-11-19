import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../core/services/admin.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-admin-order-assign-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (order) {
      <div class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto space-y-3">
          <div class="flex justify-between"><h3 class="font-extrabold">اختيار مندوب للطلب #{{ order.order_number }}</h3><button (click)="close.emit()">✕</button></div>
          @for (d of smart(); track d.id) {
            <div class="p-3 border rounded-xl flex items-center justify-between">
              <div>
                <p class="font-bold">{{ d.name }} <span class="text-xs text-gray-500">{{ d.phone }}</span></p>
                <p class="text-xs">
                  <span class="badge" [class]="d.smart_status === 'available' ? 'bg-emerald-100 text-emerald-800' : d.smart_status === 'busy' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-600'">
                    {{ d.smart_status === 'available' ? 'متاح' : d.smart_status === 'busy' ? 'مشغول' : 'غير متصل' }}</span>
                  طلبات نشطة: {{ d.active_orders_count }} @if (d.distance_km !== null) { — {{ d.distance_km }} كم }
                </p>
              </div>
              <button (click)="assign(d.id)" class="btn btn-success text-xs">إسناد</button>
            </div>
          } @empty { <p class="text-center text-gray-500">لا يوجد مندوبون.</p> }
        </div>
      </div>
    }
  `
})
export class AdminOrderAssignModalComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  @Input() order: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() assigned = new EventEmitter<void>();

  readonly smart = signal<any[]>([]);

  ngOnInit(): void {
    if (this.order) {
      this.admin.getSmartDrivers(this.order.id).subscribe({ next: (r) => this.smart.set(r?.data || []) });
    }
  }

  assign(driverId: number) {
    this.admin.assignDriver(this.order.id, driverId).subscribe({
      next: () => { this.toast.success('تم إسناد المندوب'); this.assigned.emit(); },
      error: (e) => this.toast.error(e.error?.message || 'تعذر الإسناد')
    });
  }
}
