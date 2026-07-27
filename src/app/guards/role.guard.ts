import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard = (roles: string[]): CanActivateFn => {
  return (_route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isLoggedIn()) {
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    if (authService.hasAnyRole(roles)) {
      return true;
    }

    const fallback = authService.getDefaultRoute();
    if (state.url.split('?')[0] !== fallback) {
      return router.createUrlTree([fallback]);
    }

    return router.createUrlTree(['/']);
  };
};
