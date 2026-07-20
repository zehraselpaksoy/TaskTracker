import { CommonModule } from '@angular/common';

import {
  Component,
  OnInit
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  HttpClient,
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
  addOutline,
  arrowBackOutline,
  calendarOutline,
  checkmarkCircleOutline,
  chevronDownOutline,
  ellipsisHorizontalOutline,
  gridOutline,
  listOutline,
  menuOutline,
  searchOutline,
  statsChartOutline
} from 'ionicons/icons';

import { forkJoin } from 'rxjs';

import {
  BoardColumn,
  BoardTab,
  BoardTask,
  BoardTaskResponse,
  TaskPriority,
  TaskStatus
} from '../../models/board-task';

import { TeamService } from '../../services/team';

interface CategoryOption {
  id: number;
  name: string;
}

interface TeamMemberOption {
  userId: number;
  fullName: string;
}

interface CreateTaskForm {
  title: string;
  description: string;
  dueDate: string;
  priority: number;
  categoryId: number;
  assignedToUserId: number | null;
}

interface CreateTaskRequest {
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: number;
  categoryId: number;
  assignedToUserId: number | null;
  teamId: number;
}

@Component({
  selector: 'app-team-board',
  templateUrl: './team-board.page.html',
  styleUrls: ['./team-board.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonSpinner
  ]
})
export class TeamBoardPage implements OnInit {

  private readonly taskApiUrl =
    'https://localhost:7164/api/tasks';

  private readonly categoryApiUrl =
    'https://localhost:7164/api/categories';

  teamId = 0;

  teamName = 'Takım yükleniyor...';

  activeTab: BoardTab = 'board';

  searchText = '';

  isLoading = false;

  errorMessage = '';

  tasks: BoardTask[] = [];

  categories: CategoryOption[] = [];

  teamMembers: TeamMemberOption[] = [];

  isCreateTaskModalOpen = false;

  isCreatingTask = false;

  createTaskError = '';

  createTaskForm: CreateTaskForm =
    this.getEmptyCreateTaskForm();

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

  readonly columns: BoardColumn[] = [
    {
      id: 'todo',
      title: 'Yapılacaklar'
    },
    {
      id: 'inProgress',
      title: 'Devam Ediyor'
    },
    {
      id: 'done',
      title: 'Tamamlandı'
    }
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly teamService: TeamService,
    private readonly http: HttpClient
  ) {
    addIcons({
      addOutline,
      arrowBackOutline,
      calendarOutline,
      checkmarkCircleOutline,
      chevronDownOutline,
      ellipsisHorizontalOutline,
      gridOutline,
      listOutline,
      menuOutline,
      searchOutline,
      statsChartOutline
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

    this.loadBoard();
  }

  loadBoard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      team: this.teamService
        .getTeamById(this.teamId),

      tasks: this.teamService
        .getTeamTasks(this.teamId)
    }).subscribe({
      next: ({
        team,
        tasks
      }) => {
        this.teamName = team.name;

        this.teamMembers = (
          team.members ?? []
        ).map(member => ({
          userId: member.userId,
          fullName: member.fullName
        }));

        this.tasks = tasks.map(
          task => this.mapBoardTask(task)
        );

        this.isLoading = false;
      },

      error: error => {
        console.error(
          'Takım panosu yüklenemedi:',
          error
        );

        this.isLoading = false;

        if (error.status === 401) {
          this.errorMessage =
            'Oturumunuz sona ermiş olabilir. Lütfen tekrar giriş yapın.';

          return;
        }

        if (error.status === 403) {
          this.errorMessage =
            'Bu takımın panosunu görüntüleme yetkiniz yok.';

          return;
        }

        if (error.status === 404) {
          this.errorMessage =
            'Takım veya görevler bulunamadı.';

          return;
        }

        this.errorMessage =
          'Pano verileri yüklenirken bir hata oluştu.';
      }
    });
  }

  openCreateTask(
    status: TaskStatus = 'todo'
  ): void {
    /*
     * Backend CreateTaskAsync içinde yeni görevlerin
     * durumunu her zaman Pending yapıyor.
     * Bu nedenle tıklanan sütun şimdilik API'ye gönderilmiyor.
     */
    console.log(
      'Görev şu sütundan oluşturuluyor:',
      status
    );

    this.createTaskError = '';

    this.createTaskForm =
      this.getEmptyCreateTaskForm();

    this.isCreateTaskModalOpen = true;

    if (this.categories.length === 0) {
      this.loadCategories();
    }
  }

  closeCreateTaskModal(): void {
    if (this.isCreatingTask) {
      return;
    }

    this.isCreateTaskModalOpen = false;

    this.createTaskError = '';

    this.createTaskForm =
      this.getEmptyCreateTaskForm();
  }

  createTask(): void {
    this.createTaskError = '';

    const title =
      this.createTaskForm.title.trim();

    if (!title) {
      this.createTaskError =
        'Görev başlığı boş bırakılamaz.';

      return;
    }

    if (
      this.createTaskForm.categoryId <= 0
    ) {
      this.createTaskError =
        'Lütfen bir kategori seçin.';

      return;
    }

    const request: CreateTaskRequest = {
      title,

      description:
        this.createTaskForm.description
          .trim() || null,

      dueDate:
        this.convertDueDateToIso(
          this.createTaskForm.dueDate
        ),

      priority:
        this.createTaskForm.priority,

      categoryId:
        this.createTaskForm.categoryId,

      assignedToUserId:
        this.createTaskForm
          .assignedToUserId,

      teamId:
        this.teamId
    };

    this.isCreatingTask = true;

    this.http.post(
      this.taskApiUrl,
      request,
      {
        responseType: 'text'
      }
    ).subscribe({
      next: response => {
        console.log(
          'Görev oluşturuldu:',
          response
        );

        this.isCreatingTask = false;

        this.isCreateTaskModalOpen = false;

        this.createTaskForm =
          this.getEmptyCreateTaskForm();

        this.loadBoard();
      },

      error: (
        error: HttpErrorResponse
      ) => {
        console.error(
          'Görev oluşturulamadı:',
          error
        );

        this.isCreatingTask = false;

        this.createTaskError =
          this.getCreateTaskErrorMessage(
            error
          );
      }
    });
  }

  private loadCategories(): void {
    this.http.get<CategoryOption[]>(
      this.categoryApiUrl
    ).subscribe({
      next: categories => {
        this.categories = categories;

        if (
          categories.length === 1 &&
          this.createTaskForm.categoryId === 0
        ) {
          this.createTaskForm.categoryId =
            categories[0].id;
        }
      },

      error: error => {
        console.error(
          'Kategoriler yüklenemedi:',
          error
        );

        this.createTaskError =
          'Kategoriler yüklenemedi. Kategori endpointini kontrol edin.';
      }
    });
  }

  private getEmptyCreateTaskForm():
    CreateTaskForm {
    return {
      title: '',
      description: '',
      dueDate: '',
      priority: 1,
      categoryId: 0,
      assignedToUserId: null
    };
  }

  private convertDueDateToIso(
    dueDate: string
  ): string | null {
    if (!dueDate) {
      return null;
    }

    const date = new Date(dueDate);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toISOString();
  }

  private getCreateTaskErrorMessage(
    error: HttpErrorResponse
  ): string {
    if (error.status === 0) {
      return 'Backend sunucusuna ulaşılamadı.';
    }

    if (error.status === 400) {
      return this.extractBackendError(
        error,
        'Görev bilgileri geçersiz.'
      );
    }

    if (error.status === 401) {
      return 'Oturumunuz sona ermiş olabilir. Lütfen tekrar giriş yapın.';
    }

    if (error.status === 403) {
      return 'Bu takımda görev oluşturmak için takım lideri olmalısınız.';
    }

    if (error.status === 404) {
      return 'Takım, kategori veya kullanıcı bulunamadı.';
    }

    return this.extractBackendError(
      error,
      'Görev oluşturulurken bir hata oluştu.'
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
    typeof error.error.message ===
      'string'
  ) {
    return error.error.message;
  }

  if (
    error.error?.errors &&
    typeof error.error.errors ===
      'object'
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
          (message: unknown) => {
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

  private mapBoardTask(
    response: BoardTaskResponse
  ): BoardTask {
    const assigneeName =
      response.assignedToName ??
      'Atanmamış';

    return {
      id: response.id,

      key: `TASK-${response.id}`,

      title: response.title,

      status: this.mapTaskStatus(
        response.status
      ),

      priority: this.mapTaskPriority(
        response.priority
      ),

      dueDate: response.dueDate,

      assignedToUserId:
        response.assignedToUserId,

      assigneeName,

      assigneeInitials:
        this.getInitials(
          response.assignedToName
        )
    };
  }

  private getInitials(
    fullName: string | null
  ): string {
    if (!fullName) {
      return '?';
    }

    const nameParts = fullName
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

    const firstInitial = nameParts[0]
      .charAt(0);

    const lastInitial =
      nameParts[nameParts.length - 1]
        .charAt(0);

    return (
      firstInitial +
      lastInitial
    ).toLocaleUpperCase('tr-TR');
  }

  private mapTaskStatus(
    status: string | number
  ): TaskStatus {
    if (typeof status === 'number') {
      const statusMap:
        Record<number, TaskStatus> = {
          0: 'todo',
          1: 'inProgress',
          2: 'done'
        };

      return statusMap[status] ?? 'todo';
    }

    const normalizedStatus = status
      .trim()
      .replace(/[\s_-]/g, '')
      .toLocaleLowerCase('tr-TR');

    const statusMap:
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

    return (
      statusMap[normalizedStatus] ??
      'todo'
    );
  }

  private mapTaskPriority(
    priority: string | number
  ): TaskPriority {
    if (typeof priority === 'number') {
      const priorityMap:
        Record<number, TaskPriority> = {
          0: 'low',
          1: 'medium',
          2: 'high'
        };

      return (
        priorityMap[priority] ??
        'medium'
      );
    }

    const normalizedPriority =
      priority
        .trim()
        .replace(/[\s_-]/g, '')
        .toLocaleLowerCase('tr-TR');

    const priorityMap:
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

    return (
      priorityMap[normalizedPriority] ??
      'medium'
    );
  }

  setActiveTab(
    tab: BoardTab
  ): void {
    this.activeTab = tab;
  }

  goBack(): void {
    this.router.navigate([
      '/teams'
    ]);
  }

  openTask(
    task: BoardTask
  ): void {
    console.log(
      'Görev detayı açılacak:',
      task.id
    );
  }

  openBoardMenu(): void {
    console.log(
      'Pano menüsü açılacak'
    );
  }

  openTeamMenu(): void {
    console.log(
      'Takım seçimi açılacak'
    );
  }

  getTasksByStatus(
    status: TaskStatus
  ): BoardTask[] {
    const normalizedSearch =
      this.searchText
        .trim()
        .toLocaleLowerCase('tr-TR');

    return this.tasks.filter(task => {
      const matchesStatus =
        task.status === status;

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

  formatDueDate(
    dueDate: string | null
  ): string {
    if (!dueDate) {
      return 'Tarih yok';
    }

    const date = new Date(dueDate);

    if (
      Number.isNaN(date.getTime())
    ) {
      return 'Tarih yok';
    }

    return new Intl.DateTimeFormat(
      'tr-TR',
      {
        day: '2-digit',
        month: 'short'
      }
    ).format(date);
  }

  trackTask(
    index: number,
    task: BoardTask
  ): number {
    return task.id;
  }
}