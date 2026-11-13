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
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-extrabold text-gray-900 mb-6">♥ المفضلة</h1>
      @if (products().length === 0) {
        <div class="card p-12 text-center text-gray-500">لا توجد منتجات في المفضلة.</div>
      }
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        @for (p of products(); track p.id) { <app-product-card [product]="p"></app-product-card> }
      </div>
    </div>
  `
})
export class WishlistComponent implements OnInit {
  private readonly cart = inject(CartService);
  readonly products = signal<Product[]>([]);
  ngOnInit(): void {
    this.cart.getWishlist().subscribe({
      next: (list) => this.products.set((list || []).map((w) => w.product).filter(Boolean))
    });
  }
}
