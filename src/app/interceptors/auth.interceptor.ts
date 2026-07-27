import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

function isPublicCatalogRequest(url: string, method: string): boolean {
  if (method !== 'GET') {
    return false;
  }

  return /\/api\/(tariffs|addons|devices)(\/|$)/.test(url);
}

function shouldForceLogout(url: string, status: number): boolean {
  if (status !== 401) {
    return false;
  }

  // Eski/bozuk endpoint'ler veya opsiyonel istekler oturumu düşürmemeli.
  if (/\/termination-preview(\/|$|\?)/.test(url)) {
    return false;
  }

  return true;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (req.url.includes('/api/auth/login')) {
    return next(req);
  }

  const token = authService.getToken();
  const skipAuthHeader = isPublicCatalogRequest(req.url, req.method);

  const authReq = token && !skipAuthHeader
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(authReq).pipe(
    catchError((error) => {
      if (shouldForceLogout(req.url, error.status)) {
        authService.logout();

        const currentPath = router.url.split('?')[0];
        if (currentPath !== '/login' && currentPath !== '/') {
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
