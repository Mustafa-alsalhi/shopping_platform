import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { StorefrontService } from '../../../../core/services/storefront.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LocationPickerComponent } from '../../../../shared/components/location-picker.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-md mx-auto my-12 p-6 card">
      <h1 class="text-xl font-extrabold text-gray-900 mb-2">استعادة كلمة المرور</h1>
      @if (!stepReset()) {
        <form (ngSubmit)="onSendOtp()" class="space-y-4">
          <p class="text-xs text-gray-500">أدخل رقم جوالك المسجل لإرسال رمز استعادة كلمة المرور عبر الواتساب.</p>
          <input type="text" [(ngModel)]="phone" name="phone" required class="input" placeholder="77xxxxxxx" />
          <button type="submit" [disabled]="loading()" class="btn btn-primary w-full">إرسال رمز الاستعادة</button>
        </form>
      } @else {
        <form (ngSubmit)="onResetPassword()" class="space-y-4">
          <div>
            <label class="block text-xs font-bold mb-1">رمز التحقق (OTP)</label>
            <input type="text" [(ngModel)]="otp" name="otp" required class="input" />
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">كلمة المرور الجديدة</label>
            <input type="password" [(ngModel)]="password" name="password" required class="input" />
          </div>
          <div>
            <label class="block text-xs font-bold mb-1">تأكيد كلمة المرور الجديدة</label>
            <input type="password" [(ngModel)]="passwordConfirmation" name="passwordConfirmation" required class="input" />
          </div>
          <button type="submit" [disabled]="loading()" class="btn btn-primary w-full">تغيير كلمة المرور</button>
        </form>
      }
    </div>
  `
})
export class ForgotPasswordComponent {
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  phone = '';
  otp = '';
  password = '';
  passwordConfirmation = '';
  readonly loading = signal(false);
  readonly stepReset = signal(false);

  onSendOtp() {
    this.loading.set(true);
    this.auth.forgotPassword(this.phone).subscribe({
      next: () => {
        this.loading.set(false);
        this.stepReset.set(true);
        this.toast.success('تم إرسال رمز استعادة كلمة المرور عبر الواتساب');
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error(err.error?.message || 'تعذر إرسال الرمز');
      }
    });
  }

  onResetPassword() {
    this.loading.set(true);
    this.auth
      .resetPassword({
        phone: this.phone,
        otp: this.otp,
        password: this.password,
        password_confirmation: this.passwordConfirmation
      })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.toast.success('تم تغيير كلمة المرور بنجاح');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          this.loading.set(false);
          this.toast.error(err.error?.message || 'تحقق من الرمز المدخل');
        }
      });
  }
}
