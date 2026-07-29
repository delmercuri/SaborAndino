import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

const TOKEN_KEY = 'sabor-andino-api-token';
const LOCAL_SESSION_KEY = 'sabor-andino-admin-session';
const TEMPORARY_SESSION_KEY = 'sabor-andino-admin-temporary-session';

export const adminAuthInterceptor: HttpInterceptorFn = (request, next) => {
  const protectedRequest =
    request.url.includes('/api/frontend/admin/') ||
    request.url.includes('/auth/profile') ||
    request.url.includes('/auth/change-password');

  if (!protectedRequest || typeof window === 'undefined') {
    return next(request);
  }

  const router = inject(Router);
  const token =
    localStorage.getItem(TOKEN_KEY) ??
    sessionStorage.getItem(TOKEN_KEY);

  const outgoingRequest = token
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : request;

  return next(outgoingRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(LOCAL_SESSION_KEY);
        sessionStorage.removeItem(TEMPORARY_SESSION_KEY);

        const returnUrl = `${window.location.pathname}${window.location.search}`;
        void router.navigate(['/admin/login'], {
          queryParams: { returnUrl },
          replaceUrl: true
        });
      }

      return throwError(() => error);
    })
  );
};
