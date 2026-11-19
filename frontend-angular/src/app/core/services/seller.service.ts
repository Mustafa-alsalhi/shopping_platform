import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SellerService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/seller`;

  getStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/statistics`);
  }

  getProducts(search?: string, status?: string): Observable<any[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    return this.http.get<any[]>(`${this.apiUrl}/products`, { params });
  }

  getProduct(id: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products/${id}`);
  }

  createProduct(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/products`, formData);
  }

  updateProduct(id: number | string, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/products/${id}`, formData);
  }

  deleteProduct(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/products/${id}`);
  }

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/categories`);
  }

  createCategory(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/categories`, payload);
  }

  updateCategory(id: number | string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/categories/${id}`, payload);
  }

  deleteCategory(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/categories/${id}`);
  }

  getOrders(status?: string): Observable<any> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<any>(`${this.apiUrl}/orders`, { params });
  }

  getOrder(id: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/orders/${id}`);
  }

  updateOrderStatus(id: number | string, payload: { status?: string; seller_status?: string; preparation_time?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/orders/${id}/status`, payload);
  }

  getPaymentRequests(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/payment-requests`);
  }

  getSettings(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/settings`);
  }

  updateSettings(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/settings`, formData);
  }

  getOffers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/offers`);
  }

  createOffer(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/offers`, formData);
  }

  updateOffer(id: number | string, formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/offers/${id}`, formData);
  }

  deleteOffer(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/offers/${id}`);
  }

  getOfferProducts(offerId: number | string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/offers/${offerId}/products`);
  }

  addOfferProduct(offerId: number | string, productId: number | string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/offers/${offerId}/products`, { product_id: productId });
  }

  removeOfferProduct(offerId: number | string, productId: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/offers/${offerId}/products/${productId}`);
  }

  getCoupons(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/coupons`);
  }

  createCoupon(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/coupons`, payload);
  }

  updateCoupon(id: number | string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/coupons/${id}`, payload);
  }

  toggleCoupon(id: number | string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/coupons/${id}/toggle-status`, {});
  }

  deleteCoupon(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/coupons/${id}`);
  }

  getMessages(status?: string): Observable<any> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<any>(`${this.apiUrl}/messages`, { params });
  }

  replyMessage(id: number | string, reply: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/messages/${id}`, { reply });
  }

  markMessageRead(id: number | string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/messages/${id}/read`, {});
  }

  archiveMessage(id: number | string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/messages/${id}/archive`, {});
  }

  deleteMessage(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/messages/${id}`);
  }

  getNotifications(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/notifications`);
  }

  markNotificationRead(id: number | string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/notifications/${id}/read`, {});
  }

  markAllNotificationsRead(): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/notifications/read-all`, {});
  }

  getComprehensiveReport(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/comprehensive`);
  }

  getKpis(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/kpis`);
  }

  getSalesTrends(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/sales-trends`, { params: { period } });
  }

  getTopProducts(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/top-products`);
  }

  getLowStock(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reports/low-stock`);
  }
}
