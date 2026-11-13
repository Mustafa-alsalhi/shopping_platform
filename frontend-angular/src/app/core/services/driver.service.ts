import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DriverService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/driver`;

  getStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/statistics`);
  }

  getAssignedOrders(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/orders`);
  }

  getCompletedOrders(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/orders/completed`);
  }

  getOrderDetails(id: number | string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/orders/${id}`);
  }

  updateOrderStatus(id: number | string, payload: { driver_status: string; delivery_code?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/orders/${id}/status`, payload);
  }

  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/profile`);
  }

  updateOnlineStatus(payload: { is_online?: boolean; latitude?: number; longitude?: number; work_zone?: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/profile/status`, payload);
  }

  updateSettings(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/settings`, formData);
  }

  getNearbyStores(lat?: number, lng?: number): Observable<any> {
    let params = new HttpParams();
    if (lat !== undefined) params = params.set('lat', String(lat));
    if (lng !== undefined) params = params.set('lng', String(lng));
    return this.http.get<any>(`${this.apiUrl}/nearby-stores`, { params });
  }
}

