import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

import { AuthService } from '../../services/auth';
import { TeamInvitationService } from '../../services/team-invitation';

@Component({
  selector: 'app-team-invitation',
  templateUrl: './team-invitation.page.html',
  styleUrls: ['./team-invitation.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent
  ]
})
export class TeamInvitationPage implements OnInit {
  invitationToken = '';

  isLoading = false;
  isLoggedIn = false;
  isCompleted = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly invitationService: TeamInvitationService
  ) {}

  ngOnInit(): void {
    this.invitationToken =
      this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';

    this.isLoggedIn = this.authService.isLoggedIn();

    if (!this.invitationToken) {
      this.errorMessage =
        'Davet bağlantısı eksik veya geçersiz.';
      return;
    }

    if (!this.isLoggedIn) {
      localStorage.setItem(
        'pendingTeamInvitationToken',
        this.invitationToken
      );
    }
  }

  acceptInvitation(): void {
    this.respondToInvitation(true);
  }

  rejectInvitation(): void {
    this.respondToInvitation(false);
  }

  goToLogin(): void {
    localStorage.setItem(
      'pendingTeamInvitationToken',
      this.invitationToken
    );

    this.router.navigate(['/login']);
  }

  goToTeams(): void {
    this.router.navigate(['/teams']);
  }
  goToRegister(): void {
  localStorage.setItem(
    'pendingTeamInvitationToken',
    this.invitationToken
  );

  void this.router.navigate(['/register']);
}

  private respondToInvitation(accept: boolean): void {
    if (!this.invitationToken || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.invitationService.respondInvitation({
      token: this.invitationToken,
      accept
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isCompleted = true;
        this.successMessage = response.message;

        localStorage.removeItem(
          'pendingTeamInvitationToken'
        );
      },

      error: (error) => {
        this.isLoading = false;

        if (error.status === 0) {
          this.errorMessage =
            'Sunucuya bağlanılamadı.';
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

        this.errorMessage =
          'Davet işlemi gerçekleştirilemedi.';
      }
    });
  }
}