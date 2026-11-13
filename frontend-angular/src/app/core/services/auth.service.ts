import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http: HttpClient = inject(HttpClient);
  private readonly router: Router = inject(Router);
  private readonly apiUrl = environment.apiUrl;

  readonly currentUser = signal<User | null>(this.loadStoredUser());
  readonly token = signal<string | null>(localStorage.getItem('token'));
  readonly isAuthenticated = computed(() => !!this.token());

  private loadStoredUser(): User | null {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  setSession(token: string, user: User) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.token.set(token);
    this.currentUser.set(user);
  }

  clearSession() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.token.set(null);
    this.currentUser.set(null);
  }

  login(payload: { phone?: string; email?: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, payload).pipe(
      tap((res) => {
        if (res?.access_token && res?.user) {
          this.setSession(res.access_token, res.user);
        } else if (res?.token && res?.user) {
          this.setSession(res.token, res.user);
        }
      })
    );
  }

  verifyLoginOtp(payload: { phone: string; otp: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verify-login-otp`, payload).pipe(
      tap((res) => {
        const tok = res?.access_token || res?.token;
        if (tok && res?.user) {
          this.setSession(tok, res.user);
        }
      })
    );
  }

  resendLoginOtp(phone: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/resend-login-otp`, { phone });
  }

  register(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, payload).pipe(
      tap((res) => {
        const tok = res?.access_token || res?.token;
        if (tok && res?.user) {
          this.setSession(tok, res.user);
        }
      })
    );
  }

  verifyRegisterOtp(payload: { phone: string; otp: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/verify-register-otp`, payload).pipe(
      tap((res) => {
        const tok = res?.access_token || res?.token;
        if (tok && res?.user) {
          this.setSession(tok, res.user);
        }
      })
    );
  }

  resendRegisterOtp(phone: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/resend-register-otp`, { phone });
  }

  forgotPassword(phone: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/forgot-password`, { phone });
  }

  resetPassword(payload: { phone: string; otp: string; password: string; password_confirmation: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reset-password`, payload);
  }

  registerSeller(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/seller/register`, formData);
  }

  fetchCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/user`).pipe(
      tap((user) => {
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
          this.currentUser.set(user);
        }
      })
    );
  }

  updateProfile(payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/user/profile`, payload).pipe(
      tap((res) => {
        const updated = res?.user || res;
        if (updated?.id) {
          localStorage.setItem('user', JSON.stringify(updated));
          this.currentUser.set(updated);
        }
      })
    );
  }

  logout() {
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      complete: () => {
        this.clearSession();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.clearSession();
        this.router.navigate(['/login']);
      }
    });
  }
}

