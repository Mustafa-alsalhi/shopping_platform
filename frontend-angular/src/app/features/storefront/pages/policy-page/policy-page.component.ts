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
  selector: 'app-policy-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-10">
      <div class="card p-8 space-y-4">
        <h1 class="text-2xl font-extrabold text-gray-900">{{ policy()?.title || 'السياسات والشروط' }}</h1>
        <div class="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{{ policy()?.content || 'تطبق الشروط والأحكام المعتمدة لدى منصة أصالة.' }}</div>
      </div>
    </div>
  `
})
export class PolicyPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly storefront = inject(StorefrontService);
  readonly policy = signal<any>(null);

  ngOnInit(): void {
    this.route.params.subscribe((p) => {
      if (p['type']) {
        this.storefront.getPolicyByType(p['type']).subscribe({
          next: (res) => this.policy.set(res?.data),
          error: () => {}
        });
      }
    });
  }
}
