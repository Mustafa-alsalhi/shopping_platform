import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastService } from './core/services/toast.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet></router-outlet>

    <div class="fixed top-4 left-4 z-[100] space-y-2 w-80 max-w-[90vw]">
      @for (t of toast.toasts(); track t.id) {
        <div
          (click)="toast.dismiss(t.id)"
          class="cursor-pointer px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white"
          [class.bg-emerald-600]="t.type === 'success'"
          [class.bg-rose-600]="t.type === 'error'"
          [class.bg-slate-700]="t.type === 'info'">
          {{ t.text }}
        </div>
      }
    </div>
  `
})
export class AppComponent implements OnInit {
  readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  ngOnInit(): void {
    // Refresh the user profile if a token exists (mirrors React getCurrentUser on load)
    if (this.auth.isAuthenticated()) {
      this.auth.fetchCurrentUser().subscribe({ error: () => {} });
    }
  }
}

