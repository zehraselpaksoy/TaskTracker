import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel
} from '@ionic/angular/standalone';

import {
  DeviceTokenService
} from '../../services/device-token.service';

import { AuthService } from '../../services/auth';

interface LoginResponse {
  token: string;
}

interface ApiError {
  status?: number;
  error?: {
    message?: string;
  } | string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton
  ]
})
export class LoginPage {
  email = '';
  password = '';

  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly deviceTokenService: DeviceTokenService,
    private readonly router: Router
  ) {}

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  login(): void {
    this.errorMessage = '';

    const email = this.email.trim().toLowerCase();
    const password = this.password;

    if (!email || !password) {
      this.errorMessage = 'E-posta ve şifre alanlarını doldurun.';
      return;
    }

    this.isLoading = true;

    this.authService.login({
      email,
      password
    }).subscribe({
     next: (response: LoginResponse) => {
  localStorage.setItem('token', response.token);

  const fcmToken = localStorage.getItem('fcmToken');

  if (!fcmToken) {
    this.isLoading = false;
    void this.router.navigate(['/teams']);
    return;
  }

  this.deviceTokenService
    .register(fcmToken)
    .subscribe({
      next: () => {
        console.log(
          'Cihaz tokenı backend’e kaydedildi.'
        );

        this.isLoading = false;
        void this.router.navigate(['/teams']);
      },

      error: (tokenError: unknown) => {
        // Token kaydı başarısız olsa bile kullanıcı giriş yapabilir.
        console.error(
          'Cihaz tokenı kaydedilemedi:',
          tokenError
        );

        this.isLoading = false;
        void this.router.navigate(['/teams']);
      }
    });
},

      error: (error: ApiError) => {
        this.isLoading = false;

        console.error('Login hatası:', error);

        if (error.status === 0) {
          this.errorMessage =
            'Sunucuya bağlanılamadı. Backend projesinin çalıştığını kontrol edin.';
          return;
        }

        if (
          typeof error.error === 'object' &&
          error.error?.message
        ) {
          this.errorMessage = error.error.message;
          return;
        }

        if (
          typeof error.error === 'string' &&
          error.error.trim()
        ) {
          this.errorMessage = error.error;
          return;
        }

        this.errorMessage = 'E-posta veya şifre hatalı.';
      }
    });
  }
}