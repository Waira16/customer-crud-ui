import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: isSafeReturnUrl(state.url)
      ? { returnUrl: state.url }
      : undefined
  });
};

function isSafeReturnUrl(url: string): boolean {
  const path = url.split('?')[0].split('#')[0].trim();
  return !!path && path !== '/' && !path.startsWith('/login');
}
