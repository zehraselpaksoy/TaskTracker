import {
  HttpInterceptorFn
} from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (
  request,
  next
) => {
  const isAuthRequest =
    request.url.includes('/api/auth/login') ||
    request.url.includes('/api/auth/register');

  if (isAuthRequest) {
    return next(request);
  }

  const token =
    localStorage.getItem('token');

  if (!token) {
    return next(request);
  }

  const authenticatedRequest =
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

  return next(authenticatedRequest);
};