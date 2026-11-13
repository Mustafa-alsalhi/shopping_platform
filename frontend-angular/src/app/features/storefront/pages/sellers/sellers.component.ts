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
  selector: 'app-sellers',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <h1 class="text-2xl font-extrabold text-gray-900">المتاجر والمطاعم المعتمدة</h1>
        <div class="flex gap-2">
          <button (click)="filterType('all')" [class]="selectedType === 'all' ? 'btn btn-primary text-xs' : 'btn btn-outline text-xs'">الكل</button>
          <button (click)="filterType('store')" [class]="selectedType === 'store' ? 'btn btn-primary text-xs' : 'btn btn-outline text-xs'">المتاجر</button>
          <button (click)="filterType('restaurant')" [class]="selectedType === 'restaurant' ? 'btn btn-primary text-xs' : 'btn btn-outline text-xs'">المطاعم</button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        @for (s of sellers(); track s.id) {
          <a [routerLink]="[s.type === 'restaurant' || s.type === 'restaurants' ? '/restaurant' : '/seller', s.id]" class="card overflow-hidden hover:shadow-xl transition flex flex-col justify-between">
            <div class="h-32 bg-gradient-to-r from-amber-500 to-orange-500 relative">
              @if (s.cover_image) {
                <img [src]="s.cover_image" class="w-full h-full object-cover" onerror="this.style.display='none'" />
              }
              @if (s.logo || s.avatar || s.avatar_image) {
                <img [src]="s.logo || s.avatar || s.avatar_image" [alt]="s.name || s.store_name"
                     class="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md absolute -bottom-6 right-4 bg-white"
                     onerror="this.style.display='none'" />
              }
              <span [class]="s.is_open ? 'bg-emerald-500 text-white' : 'bg-rose-600 text-white'" class="absolute top-2 left-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {{ s.is_open ? 'مفتوح' : 'مغلق' }}
              </span>
            </div>
            <div class="p-5 pt-8 flex-1 flex flex-col justify-between">
              <div>
                <h3 class="font-extrabold text-lg text-gray-900 mb-1">{{ s.name || s.store_name }}</h3>
                <p class="text-xs text-gray-500 line-clamp-2">{{ s.description }}</p>
              </div>
              <div class="flex items-center justify-between text-xs text-gray-600 mt-4 pt-3 border-t border-amber-100">
                <span>⭐ {{ s.rating || 0 }}</span>
                <span>📍 {{ s.city || s.address || 'صنعاء' }}</span>
              </div>
            </div>
          </a>
        }
      </div>
    </div>
  `
})
export class SellersComponent implements OnInit {
  private readonly storefront = inject(StorefrontService);
  readonly sellers = signal<Seller[]>([]);
  selectedType = 'all';

  ngOnInit(): void {
    this.filterType('all');
  }

  filterType(type: string) {
    this.selectedType = type;
    this.storefront.getSellers(type).subscribe((res) => this.sellers.set(res || []));
  }
}
