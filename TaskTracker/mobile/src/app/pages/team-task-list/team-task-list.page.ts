import { CommonModule } from '@angular/common';
import {
  Component,
  HostListener,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ActivatedRoute,
  Router
} from '@angular/router';
import {
  HttpErrorResponse
} from '@angular/common/http';

import {
  IonContent,
  IonIcon,
  IonSpinner
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  calendarOutline,
  chevronDownOutline,
  listOutline,
  searchOutline
} from 'ionicons/icons';

import {
  BoardTab,
  BoardTask,
  BoardTaskResponse,
  TaskPriority,
  TaskStatus
} from '../../models/board-task';

import { TeamService } from '../../services/team';

interface TeamMemberOption {
  userId: number;
  fullName: string;
}

@Component({
  selector: 'app-team-task-list',
  templateUrl: './team-task-list.page.html',
  styleUrls: ['./team-task-list.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonSpinner
  ]
})
export class TeamTaskListPage implements OnInit {

  teamId = 0;

  teamName = 'Takım yükleniyor...';
  activeTab: BoardTab = 'list';

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

  tasks: BoardTask[] = [];

  teamMembers: TeamMemberOption[] = [];

  searchText = '';

  selectedAssigneeId: number | null = null;

  selectedPriority: TaskPriority | null = null;

  selectedStatus: TaskStatus | null = null;

  isAssigneeMenuOpen = false;

  isPriorityMenuOpen = false;

  isStatusMenuOpen = false;

  isLoading = false;

  errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly teamService: TeamService
  ) {
    addIcons({
      arrowBackOutline,
      calendarOutline,
      chevronDownOutline,
      listOutline,
      searchOutline
    });
  }

  ngOnInit(): void {
    const id = Number(
      this.route.snapshot.paramMap.get('id')
    );

    if (
      Number.isNaN(id) ||
      id <= 0
    ) {
      this.errorMessage =
        'Geçersiz takım kimliği.';

      return;
    }

    this.teamId = id;

    this.loadPage();
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    this.closeAllMenus();
  }

  loadPage(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.teamService
      .getTeamById(this.teamId)
      .subscribe({
        next: team => {
          this.teamName = team.name;

          this.teamMembers = (
            team.members ?? []
          ).map(member => ({
            userId: member.userId,
            fullName: member.fullName
          }));

          this.loadTasks();
        },

        error: (
          error: HttpErrorResponse
        ) => {
          console.error(
            'Takım bilgisi yüklenemedi:',
            error
          );

          this.isLoading = false;

          this.errorMessage =
            this.getLoadErrorMessage(error);
        }
      });
  }

  loadTasks(): void {
    this.teamService
      .getTeamTasks(this.teamId)
      .subscribe({
        next: tasks => {
          this.tasks = tasks.map(
            task => this.mapBoardTask(task)
          );

          this.isLoading = false;
        },

        error: (
          error: HttpErrorResponse
        ) => {
          console.error(
            'Görevler yüklenemedi:',
            error
          );

          this.isLoading = false;

          this.errorMessage =
            this.getLoadErrorMessage(error);
        }
      });
  }

  goBack(): void {
  void this.router.navigate([
    '/teams'
  ]);
}

navigateToTab(
  tab: BoardTab
): void {
  if (tab === 'list') {
    return;
  }

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

  if (tab === 'calendar') {
  return;
}
}
  openTask(
    task: BoardTask
  ): void {
    void this.router.navigate([
      '/teams',
      this.teamId,
      'tasks',
      task.id
    ]);
  }

  openAssigneeMenu(): void {
    const willOpen =
      !this.isAssigneeMenuOpen;

    this.closeAllMenus();

    this.isAssigneeMenuOpen =
      willOpen;
  }

  openPriorityMenu(): void {
    const willOpen =
      !this.isPriorityMenuOpen;

    this.closeAllMenus();

    this.isPriorityMenuOpen =
      willOpen;
  }

  openStatusMenu(): void {
    const willOpen =
      !this.isStatusMenuOpen;

    this.closeAllMenus();

    this.isStatusMenuOpen =
      willOpen;
  }

  selectAssignee(
    userId: number | null
  ): void {
    this.selectedAssigneeId =
      userId;

    this.closeAllMenus();
  }

  selectPriority(
    priority: TaskPriority | null
  ): void {
    this.selectedPriority =
      priority;

    this.closeAllMenus();
  }

  selectStatus(
    status: TaskStatus | null
  ): void {
    this.selectedStatus =
      status;

    this.closeAllMenus();
  }

  getSelectedAssigneeLabel(): string {
    if (
      this.selectedAssigneeId === null
    ) {
      return 'Atanan';
    }

    const member =
      this.teamMembers.find(
        item =>
          item.userId ===
          this.selectedAssigneeId
      );

    return member?.fullName ??
      'Atanan';
  }

  getSelectedPriorityLabel(): string {
    if (
      this.selectedPriority === null
    ) {
      return 'Öncelik';
    }

    return this.getPriorityLabel(
      this.selectedPriority
    );
  }

  getSelectedStatusLabel(): string {
    if (
      this.selectedStatus === null
    ) {
      return 'Durum';
    }

    return this.getStatusLabel(
      this.selectedStatus
    );
  }

  getFilteredTasks(): BoardTask[] {
    const normalizedSearch =
      this.searchText
        .trim()
        .toLocaleLowerCase('tr-TR');

    return this.tasks.filter(task => {
      const matchesAssignee =
        this.selectedAssigneeId === null ||
        task.assignedToUserId ===
          this.selectedAssigneeId;

      const matchesPriority =
        this.selectedPriority === null ||
        task.priority ===
          this.selectedPriority;

      const matchesStatus =
        this.selectedStatus === null ||
        task.status ===
          this.selectedStatus;

      const matchesSearch =
        !normalizedSearch ||
        task.title
          .toLocaleLowerCase('tr-TR')
          .includes(normalizedSearch) ||
        task.key
          .toLocaleLowerCase('tr-TR')
          .includes(normalizedSearch) ||
        task.assigneeName
          .toLocaleLowerCase('tr-TR')
          .includes(normalizedSearch);

      return (
        matchesAssignee &&
        matchesPriority &&
        matchesStatus &&
        matchesSearch
      );
    });
  }

  getPriorityLabel(
    priority: TaskPriority
  ): string {
    const labels:
      Record<TaskPriority, string> = {
        low: 'Düşük',
        medium: 'Orta',
        high: 'Yüksek'
      };

    return labels[priority];
  }

  getPrioritySymbol(
    priority: TaskPriority
  ): string {
    const symbols:
      Record<TaskPriority, string> = {
        low: '↓',
        medium: '=',
        high: '↑'
      };

    return symbols[priority];
  }

  getStatusLabel(
    status: TaskStatus
  ): string {
    const labels:
      Record<TaskStatus, string> = {
        todo: 'Yapılacak',
        inProgress: 'Devam Ediyor',
        done: 'Tamamlandı'
      };

    return labels[status];
  }

  formatDueDate(
    dueDate: string | null
  ): string {
    if (!dueDate) {
      return 'Tarih yok';
    }

    const date =
      new Date(dueDate);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return 'Tarih yok';
    }

    return new Intl.DateTimeFormat(
      'tr-TR',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }
    ).format(date);
  }

  trackTask(
    index: number,
    task: BoardTask
  ): number {
    return task.id;
  }

  private closeAllMenus(): void {
    this.isAssigneeMenuOpen = false;
    this.isPriorityMenuOpen = false;
    this.isStatusMenuOpen = false;
  }

  private mapBoardTask(
    response: BoardTaskResponse
  ): BoardTask {
    const assigneeName =
      response.assignedToName ??
      'Atanmamış';

    return {
      id: response.id,

      key:
        `TASK-${response.id}`,

      title:
        response.title,

      status:
        this.mapTaskStatus(
          response.status
        ),

      priority:
        this.mapTaskPriority(
          response.priority
        ),

      dueDate:
        response.dueDate,

      assignedToUserId:
        response.assignedToUserId,

      assigneeName,

      assigneeInitials:
        this.getInitials(
          response.assignedToName
        )
    };
  }

  private mapTaskStatus(
    status: string | number
  ): TaskStatus {
    if (
      typeof status === 'number'
    ) {
      const map:
        Record<number, TaskStatus> = {
          0: 'todo',
          1: 'inProgress',
          2: 'done'
        };

      return map[status] ?? 'todo';
    }

    const normalizedStatus =
      status
        .trim()
        .replace(/[\s_-]/g, '')
        .toLocaleLowerCase('tr-TR');

    const map:
      Record<string, TaskStatus> = {
        todo: 'todo',
        pending: 'todo',
        yapılacak: 'todo',
        yapilacak: 'todo',

        inprogress: 'inProgress',
        devamediyor: 'inProgress',

        done: 'done',
        completed: 'done',
        tamamlandı: 'done',
        tamamlandi: 'done'
      };

    return map[normalizedStatus] ?? 'todo';
  }

  private mapTaskPriority(
    priority: string | number
  ): TaskPriority {
    if (
      typeof priority === 'number'
    ) {
      const map:
        Record<number, TaskPriority> = {
          0: 'low',
          1: 'medium',
          2: 'high'
        };

      return map[priority] ?? 'medium';
    }

    const normalizedPriority =
      priority
        .trim()
        .replace(/[\s_-]/g, '')
        .toLocaleLowerCase('tr-TR');

    const map:
      Record<string, TaskPriority> = {
        low: 'low',
        düşük: 'low',
        dusuk: 'low',

        medium: 'medium',
        orta: 'medium',

        high: 'high',
        yüksek: 'high',
        yuksek: 'high'
      };

    return map[normalizedPriority] ??
      'medium';
  }

  private getInitials(
    fullName: string | null
  ): string {
    if (!fullName) {
      return '?';
    }

    const nameParts =
      fullName
        .trim()
        .split(/\s+/)
        .filter(part => part.length > 0);

    if (nameParts.length === 0) {
      return '?';
    }

    if (nameParts.length === 1) {
      return nameParts[0]
        .charAt(0)
        .toLocaleUpperCase('tr-TR');
    }

    return (
      nameParts[0].charAt(0) +
      nameParts[
        nameParts.length - 1
      ].charAt(0)
    ).toLocaleUpperCase('tr-TR');
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
      return 'Bu takımın görevlerini görüntüleme yetkiniz yok.';
    }

    if (error.status === 404) {
      return 'Takım veya görevler bulunamadı.';
    }

    return 'Liste verileri yüklenirken bir hata oluştu.';
  }
}