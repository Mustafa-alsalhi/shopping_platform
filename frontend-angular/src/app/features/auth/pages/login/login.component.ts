import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { StorefrontService } from '../../../../core/services/storefront.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LocationPickerComponent } from '../../../../shared/components/location-picker.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40" dir="rtl">
      <div class="w-full max-w-md bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-amber-200/50 p-6 sm:p-8 space-y-6">
        <div class="text-center space-y-2">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-2xl shadow-lg">
            🔐
          </div>
          <h1 class="text-2xl font-extrabold text-gray-900">تسجيل الدخول</h1>
          <p class="text-xs sm:text-sm text-gray-500">مرحباً بعودتك! أدخل رقم الجوال أو البريد الإلكتروني</p>
        </div>

        @if (errorMsg()) {
          <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            ⚠️ {{ errorMsg() }}
          </div>
        }

        @if (!requireOtp()) {
          <form (ngSubmit)="onLogin()" class="space-y-4">
            <div>
              <label class="block text-xs font-extrabold text-gray-700 mb-1.5">رقم الجوال أو البريد الإلكتروني</label>
              <input
                type="text"
                [(ngModel)]="identifier"
                name="identifier"
                required
                class="input bg-amber-50/30 focus:bg-white"
                placeholder="77xxxxxxx أو email@domain.com" />
            </div>

            <div>
              <label class="block text-xs font-extrabold text-gray-700 mb-1.5">كلمة المرور</label>
              <div class="relative">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="password"
                  name="password"
                  required
                  class="input bg-amber-50/30 focus:bg-white pl-10"
                  placeholder="••••••••" />
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-700 text-sm"
                  [title]="showPassword() ? 'إخفاء' : 'إظهار'">
                  {{ showPassword() ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between text-xs pt-1">
              <a routerLink="/forgot-password" class="text-amber-700 font-bold hover:underline">نسيت كلمة المرور؟</a>
              <a routerLink="/become-seller" class="text-gray-500 hover:text-amber-700 hover:underline">انضم كبائع</a>
            </div>

            <button type="submit" [disabled]="loading()" class="btn btn-primary w-full py-3 font-extrabold text-sm shadow-md">
              {{ loading() ? 'جاري التحقق...' : 'دخول إلى الحساب' }}
            </button>

            <p class="text-center text-xs text-gray-600 pt-2 border-t border-amber-100">
              ليس لديك حساب؟
              <a routerLink="/register" class="text-amber-700 font-extrabold hover:underline mr-1">إنشاء حساب جديد</a>
            </p>
          </form>
        } @else {
          <form (ngSubmit)="onVerifyOtp()" class="space-y-5">
            <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1.5">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                💬 تحقق عبر الواتساب
              </div>
              <p class="text-xs text-emerald-900">
                تم إرسال رمز مكون من 6 أرقام إلى الرقم
                <strong dir="ltr" class="mx-1 font-extrabold">{{ otpPhone() }}</strong>
              </p>
            </div>

            <div class="space-y-2">
              <label class="block text-xs font-extrabold text-gray-700 text-center">أدخل رمز التحقق (OTP)</label>
              <input
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                dir="ltr"
                [(ngModel)]="otpCode"
                name="otp"
                required
                maxlength="6"
                class="input text-center text-2xl tracking-[0.5em] font-extrabold bg-amber-50/40 focus:bg-white py-3"
                placeholder="••••••" />
            </div>

            <!-- 60s Countdown & Resend -->
            <div class="bg-gray-50 border border-gray-200/80 rounded-2xl p-3.5 space-y-2.5">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-600 font-semibold">
                  {{ countdown() > 0 ? 'يمكنك طلب رمز جديد بعد' : 'لم يصلك الرمز؟' }}
                </span>
                <span
                  class="font-mono font-extrabold px-2.5 py-0.5 rounded-full"
                  [class.bg-amber-100]="countdown() > 0"
                  [class.text-amber-800]="countdown() > 0"
                  [class.bg-emerald-100]="countdown() === 0"
                  [class.text-emerald-800]="countdown() === 0"
                  dir="ltr">
                  {{ formattedCountdown() }}
                </span>
              </div>
              <div class="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
                  [style.width.%]="(countdown() / 60) * 100"></div>
              </div>
              <button
                type="button"
                (click)="onResendOtp()"
                [disabled]="countdown() > 0 || resending()"
                class="btn btn-outline w-full text-xs py-2.5 font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                @if (resending()) {
                  <span>جاري إعادة الإرسال...</span>
                } @else if (countdown() > 0) {
                  <span>إعادة الإرسال متاحة بعد {{ formattedCountdown() }}</span>
                } @else {
                  <span>إعادة إرسال رمز التحقق 🔄</span>
                }
              </button>
            </div>

            <button type="submit" [disabled]="loading() || otpCode.trim().length < 4" class="btn btn-primary w-full py-3 font-extrabold text-sm shadow-md">
              {{ loading() ? 'جاري التأكيد...' : 'تأكيد رمز الدخول' }}
            </button>
            <button type="button" (click)="cancelOtp()" class="w-full text-center text-xs text-gray-500 hover:text-amber-700 font-semibold py-1">
              ← تغيير رقم الجوال
            </button>
          </form>
        }
      </div>
    </div>
  `
})
export class LoginComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private timerId: ReturnType<typeof setInterval> | null = null;

  identifier = '';
  password = '';
  otpCode = '';
  readonly loading = signal(false);
  readonly resending = signal(false);
  readonly showPassword = signal(false);
  readonly requireOtp = signal(false);
  readonly otpPhone = signal('');
  readonly countdown = signal(0);
  readonly formattedCountdown = computed(() => {
    const s = this.countdown();
    const mm = Math.floor(s / 60).toString().padStart(2, '0');
    const ss = (s % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  });
  readonly errorMsg = signal<string | null>(null);

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private startTimer(seconds = 60): void {
    this.stopTimer();
    this.countdown.set(seconds);
    this.timerId = setInterval(() => {
      this.countdown.update((v) => {
        if (v <= 1) {
          this.stopTimer();
          return 0;
        }
        return v - 1;
      });
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  cancelOtp(): void {
    this.stopTimer();
    this.requireOtp.set(false);
    this.otpCode = '';
  }

  onLogin() {
    this.errorMsg.set(null);
    if (!this.identifier.trim() || !this.password) {
      this.errorMsg.set('يرجى إدخال رقم الجوال أو البريد الإلكتروني وكلمة المرور');
      return;
    }
    this.loading.set(true);
    const isEmail = this.identifier.includes('@');
    const payload = isEmail
      ? { email: this.identifier.trim(), password: this.password }
      : { phone: this.identifier.trim(), password: this.password };

    this.auth.login(payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res?.require_otp || res?.requires_otp) {
          this.requireOtp.set(true);
          this.otpPhone.set(res.phone || this.identifier);
          this.startTimer(60);
          this.toast.info(res.message || 'يرجى إدخال رمز التحقق المرسل عبر الواتساب');
          return;
        }
        this.toast.success('تم تسجيل الدخول بنجاح');
        this.redirectByRole(res?.user?.role);
      },
      error: (err) => {
        this.loading.set(false);
        if (err.error?.require_otp || err.error?.requires_otp) {
          this.requireOtp.set(true);
          this.otpPhone.set(err.error.phone || this.identifier);
          this.startTimer(60);
          this.toast.info(err.error.message || 'يرجى تفعيل الحساب برمز التحقق');
          return;
        }
        const msg = err.error?.message || 'بيانات الدخول غير صحيحة';
        this.errorMsg.set(msg);
        this.toast.error(msg);
      }
    });
  }

  onVerifyOtp() {
    this.errorMsg.set(null);
    this.loading.set(true);
    this.auth.verifyLoginOtp({ phone: this.otpPhone(), otp: this.otpCode.trim() }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.stopTimer();
        this.toast.success('تم التحقق وتسجيل الدخول بنجاح');
        this.redirectByRole(res?.user?.role);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'رمز التحقق غير صحيح';
        this.errorMsg.set(msg);
        this.toast.error(msg);
      }
    });
  }

  onResendOtp() {
    if (this.countdown() > 0 || this.resending()) return;
    this.errorMsg.set(null);
    this.resending.set(true);
    this.auth.resendLoginOtp(this.otpPhone()).subscribe({
      next: () => {
        this.resending.set(false);
        this.startTimer(60);
        this.toast.success('تم إرسال رمز تحقق جديد عبر الواتساب');
      },
      error: (err) => {
        this.resending.set(false);
        const msg = err.error?.message || 'تعذر إعادة الإرسال';
        this.errorMsg.set(msg);
        this.toast.error(msg);
      }
    });
  }

  private redirectByRole(role?: string) {
    if (role === 'admin') this.router.navigate(['/admin/dashboard']);
    else if (role === 'seller') this.router.navigate(['/seller/dashboard']);
    else if (role === 'driver') this.router.navigate(['/driver/dashboard']);
    else this.router.navigate(['/']);
  }
}
