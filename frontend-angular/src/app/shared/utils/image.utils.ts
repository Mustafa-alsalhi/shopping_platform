import { environment } from '../../../environments/environment';

export function resolveAdminImg(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('blob:')) return path;
  const clean = path.startsWith('/') ? path : (path.startsWith('images/') || path.startsWith('storage/') ? `/${path}` : `/storage/${path}`);
  return `${environment.storageUrl}${clean}`;
}

