import { CommonModule } from '@angular/common';

import {
  Component,
  HostListener,
  OnInit
} from '@angular/core';

import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  IonContent,
  IonIcon,
  IonSpinner
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';

import {
  arrowBackOutline,
  calendarOutline,
  checkmarkCircleOutline,
  chevronDownOutline,
  closeOutline,
  gridOutline,
  listOutline,
  menuOutline,
  statsChartOutline
} from 'ionicons/icons';

import { forkJoin } from 'rxjs';

import { BoardTab } from '../../models/board-task';
import { Team } from '../../models/team';

import {
  ReportService,
  TeamSummary
} from '../../services/report';

import { TeamService } from '../../services/teams';

@Component({
  selector: 'app-team-summary',
  templateUrl: './team-summary.page.html',
  styleUrls: ['./team-summary.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonSpinner
  ]
})
export class TeamSummaryPage implements OnInit {

  teamId = 0;

  teamName = 'Takım yükleniyor...';

  summary: TeamSummary | null = null;

  isLoading = false;

  errorMessage = '';

  /*
   * Sol navigasyon menüsü
   */

  isNavigationMenuOpen = false;

  /*
   * Takım seçici
   */

  isTeamMenuOpen = false;

  isTeamsLoading = false;

  teamMenuError = '';

  myTeams: Team[] = [];

  readonly activeTab: BoardTab = 'summary';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly reportService: ReportService,
    private readonly teamService: TeamService
  ) {
    addIcons({
      arrowBackOutline,
      calendarOutline,
      checkmarkCircleOutline,
      chevronDownOutline,
      closeOutline,
      gridOutline,
      listOutline,
      menuOutline,
      statsChartOutline
    });
  }

  ngOnInit(): void {
    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (
      Number.isNaN(id) ||
      !Number.isInteger(id) ||
      id <= 0
    ) {
      this.errorMessage =
        'Geçersiz takım kimliği.';

      return;
    }

    this.teamId = id;

    this.loadSummary();
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    this.closeNavigationMenu();
    this.closeTeamMenu();
  }

  /*
   * Özet verilerini yükleme
   */

  loadSummary(): void {
    if (this.teamId <= 0) {
      this.errorMessage =
        'Geçersiz takım bilgisi.';

      return;
    }

    this.isLoading = true;

    this.errorMessage = '';

    this.summary = null;

    forkJoin({
      team:
        this.teamService.getTeamById(
          this.teamId
        ),

      summary:
        this.reportService.getTeamSummary(
          this.teamId
        )
    }).subscribe({
      next: ({
        team,
        summary
      }) => {
        this.teamName = team.name;

        this.summary = summary;

        localStorage.setItem(
          `teamName_${this.teamId}`,
          team.name
        );

        this.isLoading = false;
      },

      error: (
        error: HttpErrorResponse
      ) => {
        console.error(
          'Takım özeti yüklenemedi:',
          error
        );

        this.isLoading = false;

        this.errorMessage =
          this.getLoadErrorMessage(
            error
          );
      }
    });
  }

  /*
   * Sol navigasyon menüsü
   */

  toggleNavigationMenu(): void {
    const willOpen =
      !this.isNavigationMenuOpen;

    this.closeAllMenus();

    this.isNavigationMenuOpen =
      willOpen;
  }

  openNavigationMenu(): void {
    this.closeAllMenus();

    this.isNavigationMenuOpen = true;
  }

  closeNavigationMenu(): void {
    this.isNavigationMenuOpen = false;
  }

  onNavigationBackdropClick(): void {
    this.closeNavigationMenu();
  }

  selectNavigationTab(
    tab: BoardTab
  ): void {
    this.closeNavigationMenu();

    this.navigateTo(tab);
  }

  /*
   * Takım seçici
   */

  openTeamMenu(): void {
    const willOpen =
      !this.isTeamMenuOpen;

    this.closeAllMenus();

    if (!willOpen) {
      return;
    }

    this.isTeamMenuOpen = true;

    this.teamMenuError = '';

    if (this.myTeams.length === 0) {
      this.loadMyTeams();
    }
  }

  closeTeamMenu(): void {
    this.isTeamMenuOpen = false;

    this.teamMenuError = '';
  }

  onTeamMenuBackdropClick(): void {
    this.closeTeamMenu();
  }

  loadMyTeams(): void {
    this.isTeamsLoading = true;

    this.teamMenuError = '';

    this.teamService
      .getMyTeams()
      .subscribe({
        next: (
          teams: Team[]
        ) => {
          this.myTeams = teams;

          this.isTeamsLoading = false;
        },

        error: (
          error: HttpErrorResponse
        ) => {
          console.error(
            'Takımlar yüklenemedi:',
            error
          );

          this.isTeamsLoading = false;

          if (error.status === 0) {
            this.teamMenuError =
              'Backend sunucusuna ulaşılamadı.';

            return;
          }

          if (error.status === 401) {
            this.teamMenuError =
              'Oturumunuz sona ermiş olabilir.';

            return;
          }

          if (error.status === 403) {
            this.teamMenuError =
              'Takımları görüntüleme yetkiniz bulunmuyor.';

            return;
          }

          this.teamMenuError =
            'Takımlar yüklenirken bir hata oluştu.';
        }
      });
  }

  async selectTeam(
    team: Team
  ): Promise<void> {
    if (team.id === this.teamId) {
      this.closeTeamMenu();

      return;
    }

    this.closeAllMenus();

    this.teamId = team.id;

    this.teamName = team.name;

    this.summary = null;

    this.errorMessage = '';

    localStorage.setItem(
      `teamName_${team.id}`,
      team.name
    );

    const navigationSucceeded =
      await this.router.navigate([
        '/teams',
        team.id,
        'summary'
      ]);

    if (!navigationSucceeded) {
      console.error(
        'Yeni takımın özet sayfasına geçilemedi.'
      );

      this.errorMessage =
        'Takım değiştirilemedi. Lütfen tekrar deneyin.';

      return;
    }

    this.loadSummary();
  }

  isActiveTeam(
    teamId: number
  ): boolean {
    return teamId === this.teamId;
  }

  trackTeam(
    index: number,
    team: Team
  ): number {
    return team.id;
  }

  /*
   * Sekme yönlendirmeleri
   */

  navigateTo(
    tab: BoardTab
  ): void {
    (
      document.activeElement as
        HTMLElement | null
    )?.blur();

    this.closeAllMenus();

    if (tab === 'summary') {
      return;
    }

    if (tab === 'board') {
      void this.router.navigate([
        '/teams',
        this.teamId
      ]);

      return;
    }

    if (tab === 'list') {
      void this.router.navigate([
        '/teams',
        this.teamId,
        'list'
      ]);

      return;
    }

    if (tab === 'calendar') {
      void this.router.navigate([
        '/teams',
        this.teamId,
        'calendar'
      ]);
    }
  }

  goBack(): void {
    this.closeAllMenus();

    void this.router.navigate([
      '/teams'
    ]);
  }

  /*
   * Yardımcı metotlar
   */

  private closeAllMenus(): void {
    this.closeNavigationMenu();

    this.closeTeamMenu();
  }

  private getLoadErrorMessage(
    error: HttpErrorResponse
  ): string {
    if (error.status === 0) {
      return 'Backend sunucusuna ulaşılamadı.';
    }

    if (error.status === 400) {
      return this.extractBackendError(
        error,
        'Takım bilgisi geçersiz.'
      );
    }

    if (error.status === 401) {
      return 'Oturumunuz sona ermiş olabilir. Lütfen tekrar giriş yapın.';
    }

    if (error.status === 403) {
      return 'Bu takımın özetini görüntüleme yetkiniz bulunmuyor.';
    }

    if (error.status === 404) {
      return 'Takım veya takım özeti bulunamadı.';
    }

    return this.extractBackendError(
      error,
      'Takım özeti yüklenirken bir hata oluştu.'
    );
  }

  private extractBackendError(
    error: HttpErrorResponse,
    fallbackMessage: string
  ): string {
    if (
      typeof error.error === 'string' &&
      error.error.trim()
    ) {
      return error.error;
    }

    if (
      error.error &&
      typeof error.error.message === 'string'
    ) {
      return error.error.message;
    }

    if (
      error.error?.errors &&
      typeof error.error.errors === 'object'
    ) {
      const messages: string[] = [];

      Object.values(
        error.error.errors as Record<
          string,
          unknown
        >
      ).forEach(value => {
        if (typeof value === 'string') {
          messages.push(value);

          return;
        }

        if (Array.isArray(value)) {
          value.forEach(
            (
              message: unknown
            ) => {
              if (
                typeof message === 'string'
              ) {
                messages.push(message);
              }
            }
          );
        }
      });

      if (messages.length > 0) {
        return messages.join(' ');
      }
    }

    return fallbackMessage;
  }
}