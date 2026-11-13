import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);
  private nextId = 1;

  success(text: string) {
    this.show('success', text);
  }

  error(text: string) {
    this.show('error', text);
  }

  info(text: string) {
    this.show('info', text);
  }

  private show(type: 'success' | 'error' | 'info', text: string) {
    const id = this.nextId++;
    this.toasts.update((list) => [...list, { id, type, text }]);
    setTimeout(() => {
      this.dismiss(id);
    }, 3500);
  }

  dismiss(id: number) {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}

