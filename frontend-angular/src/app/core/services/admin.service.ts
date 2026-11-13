import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/admin`;

  getDashboard(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard`);
  }

  // Users
  getUsers(role?: string, search?: string): Observable<any[]> {
    let params = new HttpParams();
    if (role) params = params.set('role', role);
    if (search) params = params.set('search', search);
    return this.http.get<any[]>(`${this.apiUrl}/users`, { params });
  }

  createUser(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users`, payload);
  }

  updateUser(id: number | string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/users/${id}`, payload);
  }

  deleteUser(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/users/${id}`);
  }

  // Sellers
  getSellers(type?: string, status?: string): Observable<any[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    if (status) params = params.set('status', status);
    return this.http.get<any[]>(`${this.apiUrl}/sellers`, { params });
  }

  createSeller(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/sellers`, payload);
  }

  updateSeller(id: number | string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/sellers/${id}`, payload);
  }

  deleteSeller(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/sellers/${id}`);
  }

  // Drivers & Smart Dispatch
  getDrivers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/drivers`);
  }

  getDriverStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/drivers/statistics`);
  }

  createDriver(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/drivers`, payload);
  }

  updateDriver(id: number | string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/drivers/${id}`, payload);
  }

  deleteDriver(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/drivers/${id}`);
  }

  getSmartDrivers(orderId: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/orders/${orderId}/smart-drivers`);
  }

  assignDriver(orderId: number | string, driverId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/orders/${orderId}/assign-driver`, { driver_id: driverId });
  }

  // Products & Categories & Activities
  getProducts(search?: string, type?: string): Observable<any[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (type && type !== 'all') params = params.set('type', type);
    return this.http.get<any[]>(`${this.apiUrl}/products`, { params });
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

  getCategories(type?: string): Observable<any[]> {
    let params = new HttpParams();
    if (type) params = params.set('type', type);
    return this.http.get<any[]>(`${this.apiUrl}/categories`, { params });
  }

  createCategory(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/categories`, payload);
  }

  updateCategory(id: number | string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/categories/${id}`, payload);
  }

  uploadCategoryImage(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('image', file);
    return this.http.post<any>(`${this.apiUrl}/categories/upload-image`, fd);
  }

  deleteCategory(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/categories/${id}`);
  }

  getActivities(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/activities`);
  }

  createActivity(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/activities`, payload);
  }

  updateActivity(id: number | string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/activities/${id}`, payload);
  }

  toggleActivity(id: number | string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/activities/${id}/toggle`, {});
  }

  deleteActivity(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/activities/${id}`);
  }

  // Orders
  getOrders(status?: string): Observable<any[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<any[]>(`${this.apiUrl}/orders`, { params });
  }

  getOrder(id: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/orders/${id}`);
  }

  updateOrderStatus(id: number | string, status: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/orders/${id}/status`, { status });
  }

  deleteOrder(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/orders/${id}`);
  }

  // Banners, Coupons, Offers
  getBanners(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/banners`);
  }

  createBanner(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/banners`, payload);
  }

  updateBanner(id: number | string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/banners/${id}`, payload);
  }

  uploadBannerImage(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('image', file);
    return this.http.post<any>(`${this.apiUrl}/banners/upload-image`, fd);
  }

  deleteBanner(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/banners/${id}`);
  }

  getCoupons(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/coupons`);
  }

  getCouponStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/coupons/statistics`);
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

  // Shipping, Payments, Taxes, Policies, Contact, AboutUs, Settings, Backups
  getShippingCompanies(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/shipping-companies`);
  }

  createShippingCompany(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/shipping-companies`, payload);
  }

  updateShippingCompany(id: number | string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/shipping-companies/${id}`, payload);
  }

  deleteShippingCompany(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/shipping-companies/${id}`);
  }

  getPaymentMethods(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/payment-methods`);
  }

  createPaymentMethod(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/payment-methods`, payload);
  }

  updatePaymentMethod(id: number | string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/payment-methods/${id}`, payload);
  }

  uploadPaymentIcon(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('icon', file);
    return this.http.post<any>(`${this.apiUrl}/payment-methods/upload-icon`, fd);
  }

  deletePaymentMethod(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/payment-methods/${id}`);
  }

  getPaymentRequests(status?: string): Observable<any> {
    const url = status ? `${this.apiUrl}/payment-requests/status/${status}` : `${this.apiUrl}/payment-requests`;
    return this.http.get<any>(url);
  }

  getPaymentRequestStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/payment-requests/statistics`);
  }

  updatePaymentRequest(id: number | string, status: string, admin_notes?: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/payment-requests/${id}`, { status, admin_notes });
  }

  deletePaymentRequest(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/payment-requests/${id}`);
  }

  getTaxes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/taxes`);
  }

  createTax(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/taxes`, payload);
  }

  updateTax(id: number | string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/taxes/${id}`, payload);
  }

  deleteTax(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/taxes/${id}`);
  }

  getPolicies(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/policies`);
  }

  savePolicy(payload: any): Observable<any> {
    return payload.id
      ? this.http.put<any>(`${this.apiUrl}/policies/${payload.id}`, payload)
      : this.http.post<any>(`${this.apiUrl}/policies`, payload);
  }

  deletePolicy(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/policies/${id}`);
  }

  getContactMessages(status?: string): Observable<any> {
    const url = status ? `${this.apiUrl}/contact-us/status/${status}` : `${this.apiUrl}/contact-us`;
    return this.http.get<any>(url);
  }

  getContactStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/contact-us/statistics`);
  }

  replyContactMessage(id: number | string, status: string, admin_reply?: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/contact-us/${id}`, { status, admin_reply });
  }

  deleteContactMessage(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/contact-us/${id}`);
  }

  getAboutUs(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/about-us`);
  }

  saveAboutUs(id: number | string | null, formData: FormData): Observable<any> {
    return id
      ? this.http.post<any>(`${this.apiUrl}/about-us/${id}`, formData)
      : this.http.post<any>(`${this.apiUrl}/about-us`, formData);
  }

  deleteAboutUs(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/about-us/${id}`);
  }

  getSettings(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/settings`);
  }

  updateSettings(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/settings`, formData);
  }

  listBackups(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/backups/list`);
  }

  createBackup(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/backups/create`, {});
  }

  deleteBackup(filename: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/backups/delete/${filename}`);
  }
}

