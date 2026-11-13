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
  selector: 'app-about-us-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-10">
      <div class="card p-8 space-y-6">
        @if (about()?.image_path) {
          <img [src]="about()?.image_path" [alt]="about()?.title || 'من نحن'" class="w-full max-h-72 object-cover rounded-2xl" onerror="this.style.display='none'" />
        }
        <h1 class="text-2xl font-extrabold text-gray-900">{{ about()?.title || 'من نحن - منصة أصالة' }}</h1>
        <p class="text-gray-700 leading-relaxed">{{ about()?.description || 'منصة أصالة هي وجهتك المتكاملة للتسوق الإلكتروني وتوصيل الطلبات من المتاجر والمطاعم المعتمدة.' }}</p>
        @if (about()?.mission || about()?.vision) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-amber-100">
            <div class="p-4 bg-amber-50 rounded-xl">
              <h3 class="font-bold text-amber-800 mb-2">رسالتنا</h3>
              <p class="text-sm text-gray-700">{{ about()?.mission }}</p>
            </div>
            <div class="p-4 bg-orange-50 rounded-xl">
              <h3 class="font-bold text-orange-800 mb-2">رؤيتنا</h3>
              <p class="text-sm text-gray-700">{{ about()?.vision }}</p>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class AboutUsPageComponent implements OnInit {
  private readonly storefront = inject(StorefrontService);
  readonly about = signal<any>(null);
  ngOnInit(): void {
    this.storefront.getAboutUs().subscribe({ next: (res) => this.about.set(res), error: () => {} });
  }
}
