import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
  IonIcon,
  IonSpinner
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  addOutline,
  checkboxOutline,
  gridOutline,
  peopleOutline,
  searchOutline
} from 'ionicons/icons';

import { Team } from '../../models/team';
import { TeamService } from '../../services/teams';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.page.html',
  styleUrls: ['./teams.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonSpinner
  ]
})
export class TeamsPage implements OnInit {


  private readonly teamService =
    inject(TeamService);

  private readonly router =
    inject(Router);
isProfileMenuOpen = false;
  isCreateTeamModalOpen = false;

isCreatingTeam = false;

createTeamError = '';

newTeamName = '';

newTeamDescription = '';  

  teams: Team[] = [];

  searchTerm = '';

  isLoading = false;

  errorMessage = '';

  userFullName = '';

  constructor() {
    addIcons({
      addOutline,
      checkboxOutline,
      gridOutline,
      peopleOutline,
      searchOutline
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadTeams();
  }

  get filteredTeams(): Team[] {
  const searchValue =
    this.searchTerm
      .trim()
      .toLocaleLowerCase('tr-TR');

  if (!searchValue) {
    return this.teams;
  }

  return this.teams.filter(team =>
    team.name
      .trim()
      .toLocaleLowerCase('tr-TR')
      .startsWith(searchValue)
  );
}

  get recentTeam(): Team | null {
    if (this.teams.length === 0) {
      return null;
    }

    const savedTeamId =
      localStorage.getItem(
        'lastViewedTeamId'
      );

    if (!savedTeamId) {
      return null;
    }

    const teamId = Number(savedTeamId);

    if (Number.isNaN(teamId)) {
      return null;
    }

    return (
      this.teams.find(
        (team) => team.id === teamId
      ) ?? null
    );
  }

  get userInitials(): string {
    const fullName =
      this.userFullName.trim();

    if (!fullName) {
      return 'K';
    }

    const nameParts =
      fullName.split(/\s+/);

    if (nameParts.length === 1) {
      return nameParts[0]
        .substring(0, 2)
        .toLocaleUpperCase('tr-TR');
    }

    const firstInitial =
      nameParts[0].charAt(0);

    const lastInitial =
      nameParts[
        nameParts.length - 1
      ].charAt(0);

    return (
      firstInitial +
      lastInitial
    ).toLocaleUpperCase('tr-TR');
  }

  get firstName(): string {
    const fullName =
      this.userFullName.trim();

    if (!fullName) {
      return '';
    }

    return fullName.split(/\s+/)[0];
  }
toggleProfileMenu(): void {
  this.isProfileMenuOpen =
    !this.isProfileMenuOpen;
}

closeProfileMenu(): void {
  this.isProfileMenuOpen = false;
}

logout(): void {
  this.closeProfileMenu();

  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');

  sessionStorage.clear();

  void this.router.navigateByUrl(
    '/login',
    {
      replaceUrl: true
    }
  );
}
  loadTeams(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.teamService
      .getMyTeams()
      .subscribe({
        next: (response: Team[]) => {
          this.teams = response;
          this.isLoading = false;
        },

        error: (error: unknown) => {
          console.error(
            'Takımlar yüklenemedi:',
            error
          );

          this.errorMessage =
            'Takımlar yüklenirken bir hata oluştu.';

          this.isLoading = false;
        }
      });
  }

  openTeam(
    teamId: number,
    teamName: string
  ): void {
    localStorage.setItem(
      'lastViewedTeamId',
      teamId.toString()
    );

    localStorage.setItem(
      `teamName_${teamId}`,
      teamName
    );

    this.router.navigate([
      '/teams',
      teamId
    ]);
  }

 createTeam(): void {
  this.openCreateTeamModal();
}
openCreateTeamModal(): void {
  this.newTeamName = '';
  this.newTeamDescription = '';
  this.createTeamError = '';
  this.isCreateTeamModalOpen = true;
}

closeCreateTeamModal(): void {
  if (this.isCreatingTeam) {
    return;
  }

  this.isCreateTeamModalOpen = false;
  this.createTeamError = '';
}

createNewTeam(): void {
  const name = this.newTeamName.trim();
  const description =
    this.newTeamDescription.trim();

  if (!name) {
    this.createTeamError =
      'Takım adı zorunludur.';

    return;
  }

  this.isCreatingTeam = true;
  this.createTeamError = '';

  this.teamService
    .createTeam({
      name,
      description:
        description || null
    })
    .subscribe({
      next: (createdTeam: Team) => {
        this.isCreatingTeam = false;
        this.isCreateTeamModalOpen = false;

        localStorage.setItem(
          'lastViewedTeamId',
          createdTeam.id.toString()
        );

        localStorage.setItem(
          `teamName_${createdTeam.id}`,
          createdTeam.name
        );

        this.router.navigate([
          '/teams',
          createdTeam.id
        ]);
      },

      error: (error: unknown) => {
        console.error(
          'Takım oluşturulamadı:',
          error
        );

        this.createTeamError =
          'Takım oluşturulurken bir hata oluştu.';

        this.isCreatingTeam = false;
      }
    });
}
onCreateModalBackdropClick(
  event: MouseEvent
): void {
  if (
    event.target ===
    event.currentTarget
  ) {
    this.closeCreateTeamModal();
  }
}

  openAllTasks(): void {
    this.router.navigate([
      '/tasks'
    ]);
  }

 openReports(): void {
  this.router.navigate([
    '/dashboard'
  ]);
}

  getTeamInitials(
    teamName: string
  ): string {
    const nameParts = teamName
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (nameParts.length === 0) {
      return 'T';
    }

    if (nameParts.length === 1) {
      return nameParts[0]
        .substring(0, 2)
        .toLocaleUpperCase('tr-TR');
    }

    return (
      nameParts[0].charAt(0) +
      nameParts[1].charAt(0)
    ).toLocaleUpperCase('tr-TR');
  }

  getTeamColor(
    teamId: number
  ): string {
    const colors = [
      '#ff9f1c',
      '#4f8cff',
      '#7c5cff',
      '#10b981',
      '#ec4899',
      '#06b6d4'
    ];

    return colors[
      Math.abs(teamId) %
      colors.length
    ];
  }

  trackByTeamId(
    index: number,
    team: Team
  ): number {
    return team.id;
  }

  private loadCurrentUser(): void {
    const token =
      localStorage.getItem('token');

    if (!token) {
      this.userFullName = '';
      return;
    }

    try {
      const payload =
        this.decodeJwtPayload(token);

      const nameClaim =
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name';

      this.userFullName = String(
        payload[nameClaim] ??
        payload['name'] ??
        ''
      );
    } catch (error) {
      console.error(
        'Kullanıcı bilgileri okunamadı:',
        error
      );

      this.userFullName = '';
    }
  }

  private decodeJwtPayload(
    token: string
  ): Record<string, unknown> {
    const tokenParts =
      token.split('.');

    if (tokenParts.length !== 3) {
      throw new Error(
        'Geçersiz JWT biçimi.'
      );
    }

    let base64 = tokenParts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    while (
      base64.length % 4 !== 0
    ) {
      base64 += '=';
    }

    const binaryPayload =
      atob(base64);

    const decodedPayload =
      decodeURIComponent(
        Array.from(binaryPayload)
          .map((character) => {
            const hex = character
              .charCodeAt(0)
              .toString(16)
              .padStart(2, '0');

            return `%${hex}`;
          })
          .join('')
      );

    return JSON.parse(
      decodedPayload
    ) as Record<string, unknown>;
  }

}