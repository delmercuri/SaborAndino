import { inject } from '@angular/core';

import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot
} from '@angular/router';

import {
  AdminAuthService
} from './admin-auth.service';

export const adminAuthGuard:
  CanActivateFn = (

    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot

  ) => {

    const authService =
      inject(AdminAuthService);

    const router =
      inject(Router);

    if (
      authService.isAuthenticated()
    ) {
      return true;
    }

    return router.createUrlTree(
      ['/admin/login'],
      {
        queryParams: {
          returnUrl: state.url
        }
      }
    );
  };