import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CartService } from '../../../../core/services/cart.service';
import { AuthService } from '../../../../core/services/auth.service';
import { StorefrontService } from '../../../../core/services/storefront.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Offer, Order, Product } from '../../../../core/models/models';
import { LocationPickerComponent } from '../../../../shared/components/location-picker.component';
import { ProductCardComponent } from '../../../../shared/components/product-card.component';

@Component({
  selector: 'app-customer-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8 space-y-4">
      <h1 class="text-xl font-extrabold">💬 محادثة مع المتجر</h1>
      <div class="card p-4 space-y-3 max-h-[28rem] overflow-y-auto">
        @for (m of messages(); track m.id) {
          <div class="space-y-1">
            <div class="bg-amber-100 rounded-xl p-3 text-sm max-w-[80%]">{{ m.message_text || m.message }}</div>
            @if (m.reply) { <div class="bg-emerald-100 rounded-xl p-3 text-sm max-w-[80%] mr-auto">{{ m.reply }}</div> }
          </div>
        }
        @if (messages().length === 0) { <p class="text-center text-gray-500 text-sm">لا توجد رسائل بعد، ابدأ المحادثة.</p> }
      </div>
      <form (ngSubmit)="send()" class="flex gap-2">
        <input class="input" [(ngModel)]="text" name="text" placeholder="اكتب رسالتك..." required />
        <button class="btn btn-primary">إرسال</button>
      </form>
    </div>
  `
})
export class CustomerChatComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly storefront = inject(StorefrontService);
  private readonly toast = inject(ToastService);
  readonly messages = signal<any[]>([]);
  text = '';
  private sellerId = 0;

  ngOnInit(): void {
    this.sellerId = Number(this.route.snapshot.params['sellerId']);
    this.load();
  }

  load() {
    this.storefront.getCustomerMessages().subscribe({
      next: (res) => this.messages.set((res?.data || []).filter((m: any) => !this.sellerId || m.seller_id === this.sellerId))
    });
  }

  send() {
    if (!this.text.trim()) return;
    this.storefront.sendCustomerMessage({ seller_id: this.sellerId, message: this.text }).subscribe({
      next: () => { this.text = ''; this.load(); },
      error: () => this.toast.error('تعذر إرسال الرسالة')
    });
  }
}
