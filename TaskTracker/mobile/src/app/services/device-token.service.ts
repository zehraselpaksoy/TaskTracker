import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

interface RegisterDeviceTokenRequest {
  token: string;
  platform: string;
}

interface RegisterDeviceTokenResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceTokenService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    `${environment.apiUrl}/device-tokens`;

  register(
    token: string
  ): Observable<RegisterDeviceTokenResponse> {
    const request: RegisterDeviceTokenRequest = {
      token,
      platform: 'android'
    };

    return this.http.post<RegisterDeviceTokenResponse>(
      this.apiUrl,
      request
    );
  }
}