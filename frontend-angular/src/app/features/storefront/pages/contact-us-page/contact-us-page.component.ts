import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StorefrontService } from '../../../../core/services/storefront.service';
import { CartService } from '../../../../core/services/cart.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Activity, Banner, Category, Coupon, Offer, Product, Seller } from '../../../../core/models/models';
import { ProductCardComponent } from '../../../../shared/components/product-card.component';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-10">
      <div class="card p-6 space-y-4">
        <h1 class="text-2xl font-extrabold text-gray-900">تواصل معنا</h1>
        <p class="text-sm text-gray-600">يسعدنا استقبال استفساراتكم ومقترحاتكم على مدار الساعة.</p>
        <form (ngSubmit)="submit()" class="space-y-4">
          <input type="text" [(ngModel)]="form.name" name="name" required class="input" placeholder="الاسم الكامل" />
          <input type="email" [(ngModel)]="form.email" name="email" required class="input" placeholder="البريد الإلكتروني" />
          <input type="text" [(ngModel)]="form.phone" name="phone" class="input" placeholder="رقم الجوال" />
          <input type="text" [(ngModel)]="form.subject" name="subject" required class="input" placeholder="الموضوع" />
          <textarea [(ngModel)]="form.message" name="message" rows="4" required class="input" placeholder="نص الرسالة..."></textarea>
          <button type="submit" class="btn btn-primary w-full py-2.5 font-bold">إرسال الرسالة</button>
        </form>
      </div>
    </div>
  `
})
export class ContactUsPageComponent {
  private readonly storefront = inject(StorefrontService);
  private readonly toast = inject(ToastService);
  form = { name: '', email: '', phone: '', subject: '', message: '' };

  submit() {
    this.storefront.submitContactUs(this.form).subscribe({
      next: () => {
        this.toast.success('تم إرسال رسالتك بنجاح، سنتواصل معك قريباً');
        this.form = { name: '', email: '', phone: '', subject: '', message: '' };
      },
      error: () => this.toast.error('تعذر إرسال الرسالة')
    });
  }
}
