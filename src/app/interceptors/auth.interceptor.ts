import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { isJwtExpired } from '../utils/jwt.util';

function isPublicCatalogRequest(url: string, method: string): boolean {
  if (method !== 'GET') {
    return false;
  }

  return /\/api\/(tariffs|addons|devices|v1\/devices)(\/|$)/.test(url);
}

function shouldForceLogout(url: string, status: number, token: string | null): boolean {
  if (status !== 401) {
    return false;
  }

  // Eski/bozuk endpoint'ler veya opsiyonel istekler oturumu düşürmemeli.
  if (/\/termination-preview(\/|$|\?)/.test(url)) {
    return false;
  }

  // JWT hâlâ geçerliyse 401 büyük ihtimalle eksik endpoint veya yetki sorunu.
  if (token && !isJwtExpired(token)) {
    return false;
  }

  return true;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notification = inject(NotificationService);

  if (req.url.includes('/api/auth/login')) {
    return next(req);
  }

  const skipAuthHeader = isPublicCatalogRequest(req.url, req.method);
  let token = authService.getToken();

  if (token && authService.isTokenExpired(token)) {
    authService.logout();
    token = null;
  }

  const authReq = token && !skipAuthHeader
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(authReq).pipe(
    catchError((error) => {
      const token = authService.getToken();
      if (shouldForceLogout(req.url, error.status, token)) {
        const hadToken = !!token;
        authService.logout();

        const currentPath = router.url.split('?')[0];
        if (currentPath !== '/login' && currentPath !== '/') {
          if (hadToken) {
            notification.warning('Oturumunuz sona erdi. Lütfen tekrar giriş yapın.');
          }

          const returnPath = currentPath.startsWith('/login') ? null : router.url;
          router.navigate(['/login'], returnPath
            ? { queryParams: { returnUrl: returnPath } }
            : undefined
          );
        }
      }

      return throwError(() => error);
    })
  );
};
