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

import { AuthService } from '../../services/auth';
import { RegisterRequest } from '../../models/register';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
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
export class RegisterPage {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  register(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (
      !this.firstName.trim() ||
      !this.lastName.trim() ||
      !this.email.trim() ||
      !this.password ||
      !this.confirmPassword
    ) {
      this.errorMessage = 'Lütfen tüm alanları doldurun.';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'Şifre en az 6 karakter olmalıdır.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Şifreler birbiriyle eşleşmiyor.';
      return;
    }

    const request: RegisterRequest = {
      firstName: this.firstName.trim(),
      lastName: this.lastName.trim(),
      email: this.email.trim().toLowerCase(),
      password: this.password
    };

    this.isLoading = true;

    this.authService.register(request).subscribe({
      next: () => {
        this.loginAfterRegister(
          request.email,
          request.password
        );
      },

      error: (error: {
        status?: number;
        error?: string | {
          message?: string;
          title?: string;
        };
      }) => {
        this.isLoading = false;

        console.error('Kayıt hatası:', error);

        if (error.status === 0) {
          this.errorMessage =
            'Sunucuya bağlanılamadı. Backend çalışıyor mu kontrol edin.';
          return;
        }

        if (
          typeof error.error === 'string' &&
          error.error.trim()
        ) {
          this.errorMessage = error.error;
          return;
        }

        if (
          typeof error.error === 'object' &&
          error.error !== null
        ) {
          if (error.error.message) {
            this.errorMessage = error.error.message;
            return;
          }

          if (error.error.title) {
            this.errorMessage = error.error.title;
            return;
          }
        }

        this.errorMessage =
          'Kayıt işlemi sırasında bir hata oluştu.';
      }
    });
  }

 private loginAfterRegister(
  email: string,
  password: string
): void {
  this.authService.login({
    email,
    password
  }).subscribe({
    next: (response) => {
      localStorage.setItem(
        'token',
        response.token
      );

      this.isLoading = false;

      const pendingInvitationToken =
        localStorage.getItem(
          'pendingTeamInvitationToken'
        );

      if (pendingInvitationToken) {
        void this.router.navigate(
          ['/team-invitation'],
          {
            queryParams: {
              token: pendingInvitationToken
            }
          }
        );

        return;
      }

      void this.router.navigate(['/teams']);
    },

    error: (error) => {
      this.isLoading = false;

      console.error(
        'Otomatik giriş hatası:',
        error
      );

      this.successMessage =
        'Kayıt başarılı ancak otomatik giriş yapılamadı. Lütfen giriş yapın.';

      void this.router.navigate(['/login']);
    }
  });
}

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}