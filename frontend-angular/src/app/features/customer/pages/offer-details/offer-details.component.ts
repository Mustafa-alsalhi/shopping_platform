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
  selector: 'app-offer-details',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  template: `
    @if (offer(); as o) {
      <div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div class="card p-6 bg-gradient-to-r from-rose-600 to-orange-500 text-white">
          <span class="badge bg-white text-rose-700 font-bold">خصم {{ o.discount_percentage || o.discount_value }}%</span>
          <h1 class="text-2xl font-extrabold mt-2">{{ o.title }}</h1>
          <p class="text-sm opacity-90">{{ o.description }}</p>
          @if (o.valid_until || o.end_date) { <p class="text-xs mt-2">ينتهي في: {{ (o.valid_until || o.end_date) | date:'yyyy-MM-dd' }}</p> }
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          @for (p of o.products || []; track p.id) { <app-product-card [product]="p"></app-product-card> }
        </div>
      </div>
    }
  `
})
export class OfferDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly storefront = inject(StorefrontService);
  readonly offer = signal<Offer | null>(null);
  ngOnInit(): void {
    this.route.params.subscribe((p) => this.storefront.getOfferById(p['id']).subscribe((o) => this.offer.set(o)));
  }
}
