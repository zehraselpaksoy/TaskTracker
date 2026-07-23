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
  chevronBackOutline,
  chevronDownOutline,
  chevronForwardOutline,
  closeOutline,
  gridOutline,
  listOutline,
  menuOutline,
  statsChartOutline
} from 'ionicons/icons';

import { forkJoin } from 'rxjs';

import {
  BoardTab
} from '../../models/board-task';

import {
  Team
} from '../../models/team';

import {
  TaskResponse,
  TaskService
} from '../../services/task';

import {
  TeamService
} from '../../services/teams';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: TaskResponse[];
}

@Component({
  selector: 'app-team-calendar',
  templateUrl: './team-calendar.page.html',
  styleUrls: ['./team-calendar.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonIcon,
    IonSpinner
  ]
})
export class TeamCalendarPage implements OnInit {

  teamId = 0;

  teamName = 'Takım yükleniyor...';

  readonly activeTab: BoardTab =
    'calendar';

  currentDate = new Date();

  tasks: TaskResponse[] = [];

  calendarDays: CalendarDay[] = [];

  isLoading = false;

  errorMessage = '';

  isNavigationMenuOpen = false;

  isTeamMenuOpen = false;

  isTeamsLoading = false;

  teamMenuError = '';

  myTeams: Team[] = [];

  readonly tabs: Array<{
    id: BoardTab;
    label: string;
  }> = [
    {
      id: 'summary',
      label: 'Özet'
    },
    {
      id: 'board',
      label: 'Pano'
    },
    {
      id: 'list',
      label: 'Liste'
    },
    {
      id: 'calendar',
      label: 'Takvim'
    }
  ];

  readonly weekDays = [
    'Pzt',
    'Sal',
    'Çar',
    'Per',
    'Cum',
    'Cmt',
    'Paz'
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly taskService: TaskService,
    private readonly teamService: TeamService
  ) {
    addIcons({
      arrowBackOutline,
      calendarOutline,
      checkmarkCircleOutline,
      chevronBackOutline,
      chevronDownOutline,
      chevronForwardOutline,
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
        'Geçerli bir takım bulunamadı.';

      return;
    }

    this.teamId = id;

    this.loadCalendar();
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    this.closeNavigationMenu();

    this.closeTeamMenu();
  }

  loadCalendar(): void {
    if (this.teamId <= 0) {
      this.errorMessage =
        'Geçersiz takım bilgisi.';

      return;
    }

    this.isLoading = true;

    this.errorMessage = '';

    forkJoin({
      team:
        this.teamService.getTeamById(
          this.teamId
        ),

      tasks:
        this.taskService.getTeamTasks(
          this.teamId
        )
    }).subscribe({
      next: ({
        team,
        tasks
      }) => {
        this.teamName = team.name;

        this.tasks = tasks;

        localStorage.setItem(
          `teamName_${this.teamId}`,
          team.name
        );

        this.generateCalendar();

        this.isLoading = false;
      },

      error: (
        error: HttpErrorResponse
      ) => {
        console.error(
          'Takvim verileri yüklenemedi:',
          error
        );

        this.tasks = [];

        this.calendarDays = [];

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

    this.navigateToTab(tab);
  }

  /*
   * Takım seçici
   */

  openTeamMenu(): void {
  console.log('OPEN TEAM MENU');

  const willOpen = !this.isTeamMenuOpen;

  this.closeAllMenus();

  if (!willOpen) {
    return;
  }

  this.isTeamMenuOpen = true;
  this.teamMenuError = '';

  console.log(
    'isTeamMenuOpen:',
    this.isTeamMenuOpen
  );

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

 async selectTeam(team: Team): Promise<void> {

  if (team.id === this.teamId) {
    this.closeTeamMenu();
    return;
  }

  this.closeAllMenus();

  const navigationSucceeded =
    await this.router.navigate([
      '/teams',
      team.id,
      'calendar'
    ]);

  if (!navigationSucceeded) {
    this.errorMessage =
      'Takım değiştirilemedi.';
    return;
  }

  this.teamId = team.id;
  this.teamName = team.name;

  localStorage.setItem(
    `teamName_${team.id}`,
    team.name
  );

  this.loadCalendar();
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
   * Takvim oluşturma
   */

  generateCalendar(): void {
    const year =
      this.currentDate.getFullYear();

    const month =
      this.currentDate.getMonth();

    const firstDayOfMonth =
      new Date(
        year,
        month,
        1
      );

    const lastDayOfMonth =
      new Date(
        year,
        month + 1,
        0
      );

    const totalDays =
      lastDayOfMonth.getDate();

    const firstDayIndex =
      this.convertSundayFirstToMondayFirst(
        firstDayOfMonth.getDay()
      );

    const previousMonthLastDay =
      new Date(
        year,
        month,
        0
      ).getDate();

    const totalCalendarCells = 42;

    const today = new Date();

    this.calendarDays = [];

    for (
      let index = 0;
      index < totalCalendarCells;
      index++
    ) {
      let date: Date;

      let dayNumber: number;

      let isCurrentMonth = true;

      if (index < firstDayIndex) {
        dayNumber =
          previousMonthLastDay -
          firstDayIndex +
          index +
          1;

        date = new Date(
          year,
          month - 1,
          dayNumber
        );

        isCurrentMonth = false;
      } else if (
        index >=
        firstDayIndex + totalDays
      ) {
        dayNumber =
          index -
          firstDayIndex -
          totalDays +
          1;

        date = new Date(
          year,
          month + 1,
          dayNumber
        );

        isCurrentMonth = false;
      } else {
        dayNumber =
          index -
          firstDayIndex +
          1;

        date = new Date(
          year,
          month,
          dayNumber
        );
      }

      this.calendarDays.push({
        date,
        dayNumber,
        isCurrentMonth,
        isToday:
          this.isSameDate(
            date,
            today
          ),
        tasks: []
      });
    }

    this.assignTasksToDays();
  }

  assignTasksToDays(): void {
    for (
      const task of this.tasks
    ) {
      if (!task.dueDate) {
        continue;
      }

      const dueDate =
        new Date(task.dueDate);

      if (
        Number.isNaN(
          dueDate.getTime()
        )
      ) {
        continue;
      }

      const calendarDay =
        this.calendarDays.find(
          day =>
            this.isSameDate(
              day.date,
              dueDate
            )
        );

      if (calendarDay) {
        calendarDay.tasks.push(
          task
        );
      }
    }
  }

  previousMonth(): void {
    this.currentDate =
      new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth() - 1,
        1
      );

    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate =
      new Date(
        this.currentDate.getFullYear(),
        this.currentDate.getMonth() + 1,
        1
      );

    this.generateCalendar();
  }

  goToToday(): void {
    this.currentDate =
      new Date();

    this.generateCalendar();
  }

  /*
   * Sayfa yönlendirmeleri
   */

  navigateToTab(
    tab: BoardTab
  ): void {
    (
      document.activeElement as
        HTMLElement | null
    )?.blur();

    this.closeAllMenus();

    if (tab === 'summary') {
      void this.router.navigate([
        '/teams',
        this.teamId,
        'summary'
      ]);

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
      return;
    }
  }

  goBack(): void {
    this.closeAllMenus();

    void this.router.navigate([
      '/teams'
    ]);
  }

  openTask(
    task: TaskResponse
  ): void {
    this.closeAllMenus();

    void this.router.navigate([
      '/teams',
      this.teamId,
      'tasks',
      task.id
    ]);
  }

  getMonthTitle(): string {
    return this.currentDate
      .toLocaleDateString(
        'tr-TR',
        {
          month: 'long',
          year: 'numeric'
        }
      );
  }

  getTaskStatusClass(
    status: number | string
  ): string {
    const normalized =
      String(status)
        .trim()
        .replace(
          /[\s_-]/g,
          ''
        )
        .toLocaleLowerCase(
          'tr-TR'
        );

    if (
      normalized === '2' ||
      normalized === 'done' ||
      normalized === 'completed' ||
      normalized === 'tamamlandı' ||
      normalized === 'tamamlandi'
    ) {
      return 'task-done';
    }

    if (
      normalized === '1' ||
      normalized === 'inprogress' ||
      normalized === 'devamediyor'
    ) {
      return 'task-in-progress';
    }

    return 'task-todo';
  }

  trackDay(
    index: number,
    day: CalendarDay
  ): string {
    return [
      day.date.getFullYear(),
      day.date.getMonth() + 1,
      day.date.getDate()
    ].join('-');
  }

  trackTask(
    index: number,
    task: TaskResponse
  ): number {
    return task.id;
  }

  /*
   * Yardımcı metotlar
   */

  private closeAllMenus(): void {
    this.closeNavigationMenu();

    this.closeTeamMenu();
  }

  private isSameDate(
    firstDate: Date,
    secondDate: Date
  ): boolean {
    return (
      firstDate.getFullYear() ===
        secondDate.getFullYear() &&
      firstDate.getMonth() ===
        secondDate.getMonth() &&
      firstDate.getDate() ===
        secondDate.getDate()
    );
  }

  private convertSundayFirstToMondayFirst(
    day: number
  ): number {
    return day === 0
      ? 6
      : day - 1;
  }

  private getLoadErrorMessage(
    error: HttpErrorResponse
  ): string {
    if (error.status === 0) {
      return 'Backend sunucusuna ulaşılamadı.';
    }

    if (error.status === 401) {
      return 'Oturumunuz sona ermiş olabilir. Lütfen tekrar giriş yapın.';
    }

    if (error.status === 403) {
      return 'Bu takımın takvimini görüntüleme yetkiniz bulunmuyor.';
    }

    if (error.status === 404) {
      return 'Takım veya görevler bulunamadı.';
    }

    return 'Görevler yüklenirken bir hata oluştu.';
  }
}