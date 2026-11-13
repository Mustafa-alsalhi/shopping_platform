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
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="card p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-extrabold">مرحباً {{ auth.currentUser()?.name }}</h1>
          <p class="text-xs text-gray-500">الحالة: {{ online() ? '🟢 متصل ويستقبل الطلبات' : '⚪ غير متصل' }}</p>
        </div>
        <button (click)="toggleOnline()" [class]="online() ? 'btn btn-error' : 'btn btn-success'">
          {{ online() ? 'إيقاف الاتصال' : 'الاتصال واستقبال الطلبات' }}
        </button>
      </div>

      @if (stats(); as s) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="card p-4 text-center"><p class="text-xs text-gray-500">الطلبات النشطة</p><p class="text-2xl font-extrabold text-blue-700">{{ s.active_orders }}</p></div>
          <div class="card p-4 text-center"><p class="text-xs text-gray-500">المكتملة</p><p class="text-2xl font-extrabold text-emerald-700">{{ s.completed_orders }}</p></div>
          <div class="card p-4 text-center"><p class="text-xs text-gray-500">أرباح اليوم</p><p class="text-2xl font-extrabold text-amber-700">{{ s.today_earnings | number:'1.0-2' }}</p></div>
          <div class="card p-4 text-center"><p class="text-xs text-gray-500">صافي الأرباح</p><p class="text-2xl font-extrabold text-amber-700">{{ s.net_profit | number:'1.0-2' }}</p></div>
        </div>
      }

      <div class="card p-5">
        <h2 class="font-extrabold mb-3">🏪 المتاجر القريبة منك</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          @for (st of stores(); track st.id) {
            <div class="p-3 border border-amber-200 rounded-xl text-sm flex justify-between">
              <div><p class="font-bold">{{ st.name }}</p><p class="text-xs text-gray-500">{{ st.address }}</p></div>
              <span class="text-xs font-bold text-amber-700">{{ st.distance_km !== null ? (st.distance_km + ' كم') : '' }}</span>
            </div>
          }
        </div>
      </div>
      <a routerLink="/driver/orders" class="btn btn-primary">عرض الطلبات المسندة إليّ</a>
    </div>
  `
})
export class DriverDashboardComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly driver = inject(DriverService);
  private readonly toast = inject(ToastService);

  readonly stats = signal<any>(null);
  readonly stores = signal<any[]>([]);
  readonly online = signal(false);
  private timer?: any;

  ngOnInit(): void {
    this.online.set(!!this.auth.currentUser()?.is_online);
    this.driver.getStatistics().subscribe({ next: (r) => this.stats.set(r?.data) });
    this.loadStores();
    this.timer = setInterval(() => { if (this.online()) this.pushLocation(); }, 30000);
  }

  ngOnDestroy(): void { clearInterval(this.timer); }

  loadStores() {
    const go = (lat?: number, lng?: number) => this.driver.getNearbyStores(lat, lng).subscribe({ next: (r) => this.stores.set(r?.data || []) });
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => go(p.coords.latitude, p.coords.longitude), () => go());
    } else go();
  }

  toggleOnline() {
    const next = !this.online();
    const send = (lat?: number, lng?: number) =>
      this.driver.updateOnlineStatus({ is_online: next, latitude: lat, longitude: lng }).subscribe({
        next: () => {
          this.online.set(next);
          const u = this.auth.currentUser();
          if (u) this.auth.currentUser.set({ ...u, is_online: next });
          this.toast.success(next ? 'أنت الآن متصل' : 'تم إيقاف الاتصال');
        },
        error: () => this.toast.error('تعذر تحديث الحالة')
      });
    if (next && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((p) => send(p.coords.latitude, p.coords.longitude), () => send());
    } else send();
  }

  private pushLocation() {
    navigator.geolocation?.getCurrentPosition((p) =>
      this.driver.updateOnlineStatus({ is_online: true, latitude: p.coords.latitude, longitude: p.coords.longitude }).subscribe({ error: () => {} }));
  }
}
