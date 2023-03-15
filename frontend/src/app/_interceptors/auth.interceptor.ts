import {Injectable} from '@angular/core';
import {HTTP_INTERCEPTORS, HttpErrorResponse, HttpEvent} from '@angular/common/http';
import {HttpInterceptor, HttpHandler, HttpRequest} from '@angular/common/http';

import {TokenStorageService} from '../_services/token-storage.service';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {Router} from "@angular/router";

const TOKEN_HEADER_KEY = 'x-access-token';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private tokenService: TokenStorageService, private router: Router) {
  }

  /**
   * Intercepts HTTP request and sets token header and redirects to register page if token is invalid/expired
   *
   * @param req HTTP request intercepted
   * @param next handler that uses HTTP request
   */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.tokenService.getToken();
    let authReq = req;

    // if current user has token
    if (token != null) {
      // clone the request to add the new token header.
      authReq = req.clone({headers: req.headers.set(TOKEN_HEADER_KEY, token)});
    }

    // sends request to server to authenticate
    return next.handle(authReq).pipe(tap(() => {
      },
      (err: any) => {
        // if token is invalid/expired, redirect to login page
        if (err instanceof HttpErrorResponse) {

          if (err.status !== 401) {
            return;
          }

          // logout and redirect to the login page
          this.tokenService.signOut();
          this.router.navigate(['login'], {queryParams: {expired: 'true'}}).then(() => window.location.reload());
        }
      }));
  }
}

export const AuthInterceptorProviders = [
  {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true}
];
