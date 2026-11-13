import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DriverService } from '../../../../core/services/driver.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LocationPickerComponent } from '../../../../shared/components/location-picker.component';
import { DRIVER_STATUS_LABELS, ORDER_STATUS_LABELS } from '../../../../shared/constants/order-status';

@Component({
  selector: 'app-driver-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-4">
      <div class="flex gap-2">
        <button (click)="tab.set('active')" [class]="tab() === 'active' ? 'btn btn-primary text-xs' : 'btn btn-outline text-xs'">الطلبات النشطة ({{ active().length }})</button>
        <button (click)="tab.set('history')" [class]="tab() === 'history' ? 'btn btn-primary text-xs' : 'btn btn-outline text-xs'">سجل التوصيل ({{ completed().length }})</button>
      </div>
      @for (o of (tab() === 'active' ? active() : completed()); track o.id) {
        <a [routerLink]="['/driver/orders', o.id]" class="card p-4 flex flex-wrap items-center justify-between gap-3 hover:shadow-lg">
          <div>
            <p class="font-extrabold">#{{ o.order_number }}</p>
            <p class="text-xs text-gray-500">{{ o.user?.name }} — {{ o.user?.phone }}</p>
            <span class="badge bg-blue-100 text-blue-800 mt-1">{{ driverLabel(o.driver_status) }}</span>
          </div>
          <div class="text-left"><p class="font-bold text-amber-700">{{ o.total | number:'1.0-2' }} ر.ي</p><p class="text-xs text-gray-500">توصيل: {{ o.shipping | number:'1.0-2' }}</p></div>
        </a>
      } @empty {
        <div class="card p-10 text-center text-gray-500">لا توجد طلبات.</div>
      }
    </div>
  `
})
export class DriverOrdersComponent implements OnInit {
  private readonly driver = inject(DriverService);
  readonly tab = signal<'active' | 'history'>('active');
  readonly active = signal<any[]>([]);
  readonly completed = signal<any[]>([]);

  ngOnInit(): void {
    this.driver.getAssignedOrders().subscribe({ next: (r) => this.active.set(r?.data || []) });
    this.driver.getCompletedOrders().subscribe({ next: (r) => this.completed.set(r?.data || []) });
  }
  driverLabel(s?: string) { return s ? (DRIVER_STATUS_LABELS[s] || s) : (ORDER_STATUS_LABELS['pending']); }
}
