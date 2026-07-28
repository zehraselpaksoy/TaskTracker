import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { RegisterRequest } from '../models/register';
import { environment } from '../../environments/environment';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/auth`;

  login(
    loginRequest: LoginRequest
  ): Observable<LoginResponse> {

    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      loginRequest
    );
  }

  register(
    registerRequest: RegisterRequest
  ): Observable<string> {

    return this.http.post(
      `${this.apiUrl}/register`,
      registerRequest,
      {
        responseType: 'text'
      }
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('favoriteTeamIds');
    localStorage.removeItem('lastViewedTeamId');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}