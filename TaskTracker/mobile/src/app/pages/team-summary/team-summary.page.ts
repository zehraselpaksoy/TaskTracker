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
  addCircleOutline,
  arrowBackOutline,
  calendarOutline,
  chatbubbleOutline,
  checkmarkCircleOutline,
  chevronDownOutline,
  closeOutline,
  createOutline,
  ellipseOutline,
  gridOutline,
  listOutline,
  menuOutline,
  peopleOutline,
  personAddOutline,
  personOutline,
  personRemoveOutline,
  statsChartOutline,
  swapHorizontalOutline,
  trashOutline
} from 'ionicons/icons';

import { forkJoin } from 'rxjs';

import { BoardTab,BoardTaskResponse } from '../../models/board-task';
import { Team } from '../../models/team';

import {
  ReportService,
  TeamSummary
} from '../../services/report';

import { TeamService } from '../../services/teams';
import { Activity } from '../../models/activity';

import { ActivityService } from '../../services/activity';
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

  overdueTasks: BoardTaskResponse[] = [];

  isOverdueModalOpen = false;
  activities: Activity[] = [];

  isActivitiesLoading = false;

  activityError = '';
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
    private readonly teamService: TeamService,
    private readonly activityService: ActivityService,
  ) {
   addIcons({
  addCircleOutline,
  arrowBackOutline,
  calendarOutline,
  chatbubbleOutline,
  checkmarkCircleOutline,
  chevronDownOutline,
  closeOutline,
  createOutline,
  ellipseOutline,
  gridOutline,
  listOutline,
  menuOutline,
  peopleOutline,
  personAddOutline,
  personOutline,
  personRemoveOutline,
  statsChartOutline,
  swapHorizontalOutline,
  trashOutline
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
  }

  ionViewWillEnter(): void {
    if (this.teamId > 0) {
      this.loadSummary();
    }
  }

 @HostListener('document:keydown.escape')
onEscapePressed(): void {
  this.closeNavigationMenu();
  this.closeTeamMenu();
  this.closeOverdueModal();
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
    this.overdueTasks = [];
    this.isOverdueModalOpen = false;
    this.isLoading = true;

    this.errorMessage = '';

    this.summary = null;
    this.activities = [];

forkJoin({
  team:
    this.teamService.getTeamById(
      this.teamId
    ),

  summary:
    this.reportService.getTeamSummary(
      this.teamId
    ),

  activities:
    this.activityService.getTeamActivities(
      this.teamId
    ),

  tasks:
    this.teamService.getTeamTasks(
      this.teamId
    )
}).subscribe({
  next: ({
    team,
    summary,
    activities,
    tasks
  }) => {
    this.teamName = team.name;

    this.summary = summary;

    this.activities = activities;

    this.overdueTasks =
      (tasks ?? [])
        .filter(task =>
          this.isTaskOverdue(task)
        )
        .sort((firstTask, secondTask) =>
          this.compareDueDates(
            firstTask,
            secondTask
          )
        );

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
      this.getLoadErrorMessage(error);
  }
});
  }
openOverdueModal(): void {
  if (this.overdueTasks.length === 0) {
    return;
  }

  this.closeAllMenus();

  this.isOverdueModalOpen = true;
}

closeOverdueModal(): void {
  this.isOverdueModalOpen = false;
}

openOverdueTask(
  task: BoardTaskResponse
): void {
  this.closeOverdueModal();

  void this.router.navigate([
    '/teams',
    this.teamId,
    'tasks',
    task.id
  ]);
}
formatTaskDueDate(
  dueDate: string | null
): string {
  if (!dueDate) {
    return 'Tarih belirtilmedi';
  }

  const date = new Date(dueDate);

  if (Number.isNaN(date.getTime())) {
    return 'Geçersiz tarih';
  }

  return new Intl.DateTimeFormat(
    'tr-TR',
    {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    }
  ).format(date);
}

getTaskPriorityLabel(
  priority: string | number
): string {
  const normalizedPriority =
    typeof priority === 'number'
      ? priority
      : priority
          .trim()
          .toLocaleLowerCase('tr-TR');

  if (
    normalizedPriority === 2 ||
    normalizedPriority === '2' ||
    normalizedPriority === 'high' ||
    normalizedPriority === 'yüksek' ||
    normalizedPriority === 'yuksek'
  ) {
    return 'Yüksek';
  }

  if (
    normalizedPriority === 0 ||
    normalizedPriority === '0' ||
    normalizedPriority === 'low' ||
    normalizedPriority === 'düşük' ||
    normalizedPriority === 'dusuk'
  ) {
    return 'Düşük';
  }

  return 'Orta';
}
private isTaskOverdue(
  task: BoardTaskResponse
): boolean {
  if (!task.dueDate) {
    return false;
  }

  if (this.isCompletedStatus(task.status)) {
    return false;
  }

  const dueDate =
    new Date(task.dueDate);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  return dueDate.getTime() <
    new Date().getTime();
}

private isCompletedStatus(
  status: string | number
): boolean {
  if (typeof status === 'number') {
    return status === 2;
  }

  const normalizedStatus =
    String(status)
      .trim()
      .replace(/[\s_-]/g, '')
      .toLocaleLowerCase('tr-TR');

  return (
    normalizedStatus === '2' ||
    normalizedStatus === 'done' ||
    normalizedStatus === 'completed' ||
    normalizedStatus === 'tamamlandı' ||
    normalizedStatus === 'tamamlandi'
  );
}

private compareDueDates(
  firstTask: BoardTaskResponse,
  secondTask: BoardTaskResponse
): number {
  const firstTime = firstTask.dueDate
    ? new Date(firstTask.dueDate).getTime()
    : Number.MAX_SAFE_INTEGER;

  const secondTime = secondTask.dueDate
    ? new Date(secondTask.dueDate).getTime()
    : Number.MAX_SAFE_INTEGER;

  return firstTime - secondTime;
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
getActivityIcon(type: number): string {

  switch (type) {

    case 1:
      return 'add-circle-outline';

    case 2:
      return 'create-outline';

    case 3:
      return 'swap-horizontal-outline';

    case 4:
      return 'person-outline';

    case 5:
      return 'trash-outline';

    case 6:
      return 'people-outline';

    case 7:
      return 'person-add-outline';

    case 8:
      return 'person-remove-outline';

    case 9:
    case 10:
    case 11:
      return 'chatbubble-outline';

    default:
      return 'ellipse-outline';
  }
}

getActivityColor(type: number): string {

  switch (type) {

    case 1:
      return '#22c55e';

    case 2:
      return '#3b82f6';

    case 3:
      return '#f59e0b';

    case 4:
      return '#8b5cf6';

    case 5:
      return '#ef4444';

    case 6:
      return '#14b8a6';

    case 7:
      return '#06b6d4';

    case 8:
      return '#f97316';

    case 9:
    case 10:
    case 11:
      return '#6366f1';

    default:
      return '#6b7280';
  }
}

getRelativeTime(date: string): string {

  const now = new Date();

  const activityDate = new Date(date);

  const diff =
    Math.floor(
      (now.getTime() - activityDate.getTime()) / 1000
    );

  if (diff < 60) {
    return 'Az önce';
  }

  if (diff < 3600) {
    return `${Math.floor(diff / 60)} dakika önce`;
  }

  if (diff < 86400) {
    return `${Math.floor(diff / 3600)} saat önce`;
  }

  if (diff < 604800) {
    return `${Math.floor(diff / 86400)} gün önce`;
  }

  return activityDate.toLocaleDateString('tr-TR');
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
  this.closeOverdueModal();
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