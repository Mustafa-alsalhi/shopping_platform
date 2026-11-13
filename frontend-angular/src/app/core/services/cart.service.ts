import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CartItem, Order } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly items = signal<CartItem[]>([]);
  readonly total = signal<number>(0);
  readonly count = computed(() => this.items().reduce((acc, item) => acc + item.quantity, 0));
  readonly isCartSidebarOpen = signal<boolean>(false);
  readonly wishlistIds = signal<Set<number>>(new Set());

  loadCart(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/cart`).pipe(
      tap((res) => {
        if (res?.items) {
          this.items.set(res.items);
          this.total.set(res.total || 0);
        } else if (Array.isArray(res)) {
          this.items.set(res);
          this.recalculateTotal();
        }
      })
    );
  }

  addToCart(payload: {
    product_id: number;
    quantity: number;
    unit_price?: number;
    selected_options?: any;
    force_clear?: boolean;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/cart`, payload).pipe(
      tap(() => {
        this.loadCart().subscribe();
      })
    );
  }

  updateQuantity(id: number, quantity: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/cart/${id}`, { quantity }).pipe(
      tap(() => {
        this.loadCart().subscribe();
      })
    );
  }

  removeItem(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/cart/${id}`).pipe(
      tap(() => {
        this.items.update((list) => list.filter((x) => x.id !== id));
        this.recalculateTotal();
      })
    );
  }

  clearCart(): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/cart`).pipe(
      tap(() => {
        this.items.set([]);
        this.total.set(0);
      })
    );
  }

  calculateDelivery(latitude: number, longitude: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/checkout/calculate-delivery`, { latitude, longitude });
  }

  createOrder(payload: any): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders`, payload).pipe(
      tap(() => {
        this.items.set([]);
        this.total.set(0);
      })
    );
  }

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders`);
  }

  getOrderById(id: number | string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/orders/${id}`);
  }

  getWishlist(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/wishlist`).pipe(
      tap((list) => {
        const ids = new Set<number>(list.map((w) => w.product_id));
        this.wishlistIds.set(ids);
      })
    );
  }

  toggleWishlist(productId: number): Observable<any> {
    if (this.wishlistIds().has(productId)) {
      return this.http.delete(`${this.apiUrl}/wishlist/${productId}`).pipe(
        tap(() => {
          const next = new Set(this.wishlistIds());
          next.delete(productId);
          this.wishlistIds.set(next);
        })
      );
    }
    return this.http.post(`${this.apiUrl}/wishlist`, { product_id: productId }).pipe(
      tap(() => {
        const next = new Set(this.wishlistIds());
        next.add(productId);
        this.wishlistIds.set(next);
      })
    );
  }

  private recalculateTotal() {
    const sum = this.items().reduce(
      (acc, i) => acc + i.quantity * (i.unit_price ?? i.price ?? i.product?.price ?? 0),
      0
    );
    this.total.set(sum);
  }
}

