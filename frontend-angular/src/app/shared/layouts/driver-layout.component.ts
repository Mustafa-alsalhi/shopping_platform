import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-driver-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex flex-col bg-slate-50">
      <header class="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div class="flex items-center gap-3">
          <span class="text-2xl">🛵</span>
          <div>
            <h1 class="font-extrabold text-amber-400">بوابة مندوب التوصيل</h1>
            <p class="text-xs text-slate-400">{{ auth.currentUser()?.name }}</p>
          </div>
        </div>
        <nav class="flex items-center gap-3 text-sm">
          <a routerLink="/driver/dashboard" routerLinkActive="bg-amber-600 text-white" class="px-3 py-1.5 rounded-lg hover:bg-slate-800">الرئيسية</a>
          <a routerLink="/driver/orders" routerLinkActive="bg-amber-600 text-white" class="px-3 py-1.5 rounded-lg hover:bg-slate-800">الطلبات</a>
          <a routerLink="/driver/settings" routerLinkActive="bg-amber-600 text-white" class="px-3 py-1.5 rounded-lg hover:bg-slate-800">الإعدادات والوثائق</a>
          <a routerLink="/" class="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs">المتجر</a>
          <button (click)="auth.logout()" class="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold">خروج</button>
        </nav>
      </header>

      <main class="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class DriverLayoutComponent {
  readonly auth = inject(AuthService);
}

