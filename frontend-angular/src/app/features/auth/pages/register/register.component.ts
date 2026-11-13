import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { StorefrontService } from '../../../../core/services/storefront.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LocationPickerComponent } from '../../../../shared/components/location-picker.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-[80vh] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40" dir="rtl">
      <div class="w-full max-w-lg bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl border border-amber-200/50 p-6 sm:p-8 space-y-6">
        <div class="text-center space-y-2">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-2xl shadow-lg">
            ✨
          </div>
          <h1 class="text-2xl font-extrabold text-gray-900">إنشاء حساب جديد</h1>
          <p class="text-xs sm:text-sm text-gray-500">انضم إلى منصة أصالة واستمتع بتجربة تسوق وطلب سهلة</p>
        </div>

        @if (errorMsg()) {
          <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            ⚠️ {{ errorMsg() }}
          </div>
        }

        @if (!requireOtp()) {
          <form (ngSubmit)="onRegister()" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-extrabold text-gray-700 mb-1">الاسم الأول *</label>
                <input type="text" [(ngModel)]="form.first_name" name="first_name" required class="input bg-amber-50/30 focus:bg-white" placeholder="مثال: أحمد" />
              </div>
              <div>
                <label class="block text-xs font-extrabold text-gray-700 mb-1">الاسم الأخير *</label>
                <input type="text" [(ngModel)]="form.last_name" name="last_name" required class="input bg-amber-50/30 focus:bg-white" placeholder="مثال: محمد" />
              </div>
            </div>

            <div>
              <label class="block text-xs font-extrabold text-gray-700 mb-1">رقم الجوال اليمني (واتساب) *</label>
              <input type="tel" [(ngModel)]="form.phone" name="phone" required class="input bg-amber-50/30 focus:bg-white" placeholder="77xxxxxxx (9 أرقام تبدأ بـ 77 / 73 / 71 / 70)" />
            </div>

            <div>
              <label class="block text-xs font-extrabold text-gray-700 mb-1">البريد الإلكتروني (اختياري)</label>
              <input type="email" [(ngModel)]="form.email" name="email" class="input bg-amber-50/30 focus:bg-white" placeholder="name@example.com" />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-extrabold text-gray-700 mb-1">المدينة (اختياري)</label>
                <input type="text" [(ngModel)]="form.city" name="city" class="input bg-amber-50/30 focus:bg-white" placeholder="صنعاء / عدن / تعز" />
              </div>
              <div>
                <label class="block text-xs font-extrabold text-gray-700 mb-1">العنوان (اختياري)</label>
                <input type="text" [(ngModel)]="form.address" name="address" class="input bg-amber-50/30 focus:bg-white" placeholder="الحي / الشارع" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-extrabold text-gray-700 mb-1">كلمة المرور *</label>
                <div class="relative">
                  <input
                    [type]="showPassword() ? 'text' : 'password'"
                    [(ngModel)]="form.password"
                    name="password"
                    required
                    minlength="6"
                    class="input bg-amber-50/30 focus:bg-white pl-9"
                    placeholder="6 أحرف على الأقل" />
                  <button
                    type="button"
                    (click)="showPassword.set(!showPassword())"
                    class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-xs">
                    {{ showPassword() ? '🙈' : '👁️' }}
                  </button>
                </div>
              </div>
              <div>
                <label class="block text-xs font-extrabold text-gray-700 mb-1">تأكيد كلمة المرور *</label>
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  [(ngModel)]="form.password_confirmation"
                  name="password_confirmation"
                  required
                  class="input bg-amber-50/30 focus:bg-white"
                  placeholder="أعد كتابة كلمة المرور" />
              </div>
            </div>

            <div class="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/60 border border-amber-200/70">
              <input
                id="agreeTerms"
                type="checkbox"
                [(ngModel)]="agreeTerms"
                name="agreeTerms"
                required
                class="mt-0.5 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer" />
              <label for="agreeTerms" class="text-xs text-gray-700 leading-relaxed cursor-pointer">
                أوافق على
                <a routerLink="/policy/terms" target="_blank" class="text-amber-700 font-extrabold hover:underline">الشروط والأحكام</a>
                و
                <a routerLink="/policy/privacy" target="_blank" class="text-amber-700 font-extrabold hover:underline">سياسة الخصوصية</a>
                الخاصة بالمنصة *
              </label>
            </div>

            <button type="submit" [disabled]="loading() || !agreeTerms" class="btn btn-primary w-full py-3 font-extrabold text-sm shadow-md disabled:opacity-50">
              {{ loading() ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب' }}
            </button>

            <p class="text-center text-xs text-gray-600 pt-2 border-t border-amber-100">
              لديك حساب بالفعل؟
              <a routerLink="/login" class="text-amber-700 font-extrabold hover:underline mr-1">تسجيل الدخول</a>
            </p>
          </form>
        } @else {
          <form (ngSubmit)="onVerifyOtp()" class="space-y-5">
            <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1.5">
              <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold">
                💬 تفعيل الحساب عبر الواتساب
              </div>
              <p class="text-xs text-emerald-900">
                تم إرسال رمز تفعيل مكون من 6 أرقام إلى الرقم
                <strong dir="ltr" class="mx-1 font-extrabold">{{ otpPhone() || form.phone }}</strong>
              </p>
              @if (devOtp()) {
                <p class="text-amber-800 font-bold text-xs pt-1">رمز التطوير: <span class="tracking-widest">{{ devOtp() }}</span></p>
              }
            </div>

            <div class="space-y-2">
              <label class="block text-xs font-extrabold text-gray-700 text-center">أدخل رمز التفعيل (OTP)</label>
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
                  {{ countdown() > 0 ? 'يمكنك طلب رمز جديد بعد' : 'لم يصلك الرمز على الواتساب؟' }}
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
                  class="h-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-1000"
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
                  <span>إعادة إرسال رمز التفعيل 🔄</span>
                }
              </button>
            </div>

            <button type="submit" [disabled]="loading() || otpCode.trim().length < 4" class="btn btn-primary w-full py-3 font-extrabold text-sm shadow-md">
              {{ loading() ? 'جاري التفعيل...' : 'تفعيل الحساب' }}
            </button>
            <button type="button" (click)="cancelOtp()" class="w-full text-center text-xs text-gray-500 hover:text-amber-700 font-semibold py-1">
              ← العودة لتعديل البيانات
            </button>
          </form>
        }
      </div>
    </div>
  `
})
export class RegisterComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private timerId: ReturnType<typeof setInterval> | null = null;

  form = {
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    password: '',
    password_confirmation: ''
  };
  otpCode = '';
  agreeTerms = false;
  readonly loading = signal(false);
  readonly resending = signal(false);
  readonly showPassword = signal(false);
  readonly requireOtp = signal(false);
  readonly otpPhone = signal('');
  readonly devOtp = signal<string | null>(null);
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

  onRegister() {
    this.errorMsg.set(null);
    if (!this.form.first_name.trim() || !this.form.last_name.trim() || !this.form.phone.trim() || !this.form.password) {
      this.errorMsg.set('يرجى تعبئة جميع الحقول المطلوبة (الاسم الأول، الاسم الأخير، رقم الجوال، كلمة المرور)');
      return;
    }
    if (this.form.password !== this.form.password_confirmation) {
      this.errorMsg.set('كلمة المرور وتأكيدها غير متطابقين');
      return;
    }
    if (!this.agreeTerms) {
      this.errorMsg.set('يجب الموافقة على الشروط والأحكام وسياسة الخصوصية للمتابعة');
      return;
    }

    this.loading.set(true);
    const payload = {
      ...this.form,
      first_name: this.form.first_name.trim(),
      last_name: this.form.last_name.trim(),
      name: `${this.form.first_name.trim()} ${this.form.last_name.trim()}`,
      phone: this.form.phone.trim(),
      email: this.form.email.trim() || undefined
    };

    this.auth.register(payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res?.requires_otp || res?.require_otp) {
          this.otpPhone.set(res.phone || this.form.phone);
          this.devOtp.set(res.dev_otp || null);
          this.requireOtp.set(true);
          this.startTimer(60);
          this.toast.success(res.message || 'تم إرسال رمز التحقق');
          return;
        }
        this.toast.success('تم التسجيل بنجاح');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'حدث خطأ أثناء التسجيل';
        this.errorMsg.set(msg);
        this.toast.error(msg);
      }
    });
  }

  onVerifyOtp() {
    this.errorMsg.set(null);
    this.loading.set(true);
    this.auth.verifyRegisterOtp({ phone: this.otpPhone() || this.form.phone, otp: this.otpCode.trim() }).subscribe({
      next: () => {
        this.loading.set(false);
        this.stopTimer();
        this.toast.success('تم تفعيل الحساب بنجاح');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message || 'رمز التفعيل غير صحيح';
        this.errorMsg.set(msg);
        this.toast.error(msg);
      }
    });
  }

  onResendOtp() {
    if (this.countdown() > 0 || this.resending()) return;
    this.errorMsg.set(null);
    this.resending.set(true);
    this.auth.resendRegisterOtp(this.otpPhone() || this.form.phone).subscribe({
      next: () => {
        this.resending.set(false);
        this.startTimer(60);
        this.toast.success('تم إرسال رمز تفعيل جديد عبر الواتساب');
      },
      error: (err) => {
        this.resending.set(false);
        const msg = err.error?.message || 'تعذر إعادة إرسال الرمز';
        this.errorMsg.set(msg);
        this.toast.error(msg);
      }
    });
  }
}
