import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Activity, Banner, Category, Coupon, Offer, Product, Seller, Setting } from '../models/models';

@Injectable({ providedIn: 'root' })
export class StorefrontService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  readonly settings = signal<Setting | null>(null);
  readonly activeActivities = signal<Activity[]>([]);
  readonly currentActivity = signal<string>('stores');

  loadSettings(): Observable<Setting> {
    return this.http.get<Setting>(`${this.apiUrl}/settings`).pipe(
      tap((s) => this.settings.set(s))
    );
  }

  getActivities(): Observable<{ success: boolean; data: Activity[] }> {
    return this.http.get<{ success: boolean; data: Activity[] }>(`${this.apiUrl}/activities`).pipe(
      tap((res) => {
        if (res?.data) {
          this.activeActivities.set(res.data);
        }
      })
    );
  }

  getBanners(position = 'home', type = 'store'): Observable<{ success: boolean; data: Banner[] }> {
    const params = new HttpParams().set('position', position).set('type', type);
    return this.http.get<{ success: boolean; data: Banner[] }>(`${this.apiUrl}/banners`, { params });
  }

  getProducts(filters: Record<string, any> = {}): Observable<any> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<any>(`${this.apiUrl}/products`, { params });
  }

  getFeaturedProducts(type?: string): Observable<Product[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    return this.http.get<Product[]>(`${this.apiUrl}/products/featured`, { params });
  }

  getProductById(id: number | string): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/products/${id}`);
  }

  getProductReviews(productId: number | string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/products/${productId}/reviews`);
  }

  addProductReview(productId: number | string, payload: { rating: number; comment: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/products/${productId}/reviews`, payload);
  }

  getCategories(type?: string): Observable<Category[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    return this.http.get<Category[]>(`${this.apiUrl}/categories`, { params });
  }

  getRestaurantCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/restaurant-categories`);
  }

  getSellers(type?: string, search?: string): Observable<Seller[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    if (search) params = params.set('search', search);
    return this.http.get<Seller[]>(`${this.apiUrl}/sellers`, { params });
  }

  getSellerById(id: number | string): Observable<Seller> {
    return this.http.get<Seller>(`${this.apiUrl}/sellers/${id}`);
  }

  getRestaurants(search?: string, category?: string): Observable<Seller[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (category) params = params.set('category', category);
    return this.http.get<Seller[]>(`${this.apiUrl}/restaurants`, { params });
  }

  getRestaurantById(id: number | string): Observable<Seller> {
    return this.http.get<Seller>(`${this.apiUrl}/restaurants/${id}`);
  }

  getOffers(category?: string, type?: string): Observable<Offer[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    if (type) params = params.set('type', type);
    return this.http.get<Offer[]>(`${this.apiUrl}/offers`, { params });
  }

  getOfferById(id: number | string): Observable<Offer> {
    return this.http.get<Offer>(`${this.apiUrl}/offers/${id}`);
  }

  getActiveCoupons(): Observable<{ status: string; data: Coupon[] }> {
    return this.http.get<{ status: string; data: Coupon[] }>(`${this.apiUrl}/coupons/active`);
  }

  validateCoupon(code: string, orderAmount: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/coupons/validate`, { code, order_amount: orderAmount });
  }

  getPolicyByType(type: string): Observable<{ data: any }> {
    return this.http.get<{ data: any }>(`${this.apiUrl}/policies/${type}`);
  }

  getAboutUs(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/about-us`);
  }

  submitContactUs(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/contact-us`, payload);
  }

  getActiveShippingCompanies(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/shipping-companies/active`);
  }

  getActivePaymentMethods(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/payment-methods/active`);
  }

  submitPaymentRequest(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/user/payment-requests`, formData);
  }

  getCustomerMessages(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/messages`);
  }

  sendCustomerMessage(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/messages`, payload);
  }
}

