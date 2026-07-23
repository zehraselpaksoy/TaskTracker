import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  OnInit
} from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  checkboxOutline,
  chevronForwardOutline,
  gridOutline,
  peopleOutline,
  searchOutline
} from 'ionicons/icons';

import { TaskService } from '../../services/task';

interface ApiTask {
  id: number;
  title: string;
  description?: string | null;

  teamId: number;
  teamName?: string | null;

  categoryId?: number;
  categoryName?: string | null;

  createdByUserId?: number;
  createdByName?: string | null;

  assignedToUserId?: number | null;
  assignedToName?: string | null;

  priority: number | string;
  status: number | string;

  startDate?: string | null;
  dueDate?: string | null;
  completedDate?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface UserTask {
  id: number;
  title: string;
  description?: string | null;

  teamId: number;
  teamName: string;

  categoryId?: number;
  categoryName: string;

  createdByUserId?: number;
  createdByName?: string | null;

  assignedToUserId?: number | null;
  assignedToUserName?: string | null;

  priority: number | string;
  status: number | string;

  startDate?: string | null;
  dueDate?: string | null;
  completedDate?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

type TaskFilter =
  | 'all'
  | 'open'
  | 'inProgress'
  | 'completed'
  | 'overdue';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.page.html',
  styleUrls: ['./tasks.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonSpinner
  ]
})
export class TasksPage implements OnInit {

  private readonly taskService =
    inject(TaskService);

  private readonly router =
    inject(Router);

  private readonly route =
    inject(ActivatedRoute); 

  tasks: UserTask[] = [];

  searchTerm = '';

  activeFilter: TaskFilter = 'all';

  isLoading = false;

  errorMessage = '';

  constructor() {
    addIcons({
      checkboxOutline,
      chevronForwardOutline,
      gridOutline,
      peopleOutline,
      searchOutline
    });
  }

 ngOnInit(): void {
  this.route.queryParamMap.subscribe(
    (params) => {
      const filter =
        params.get('filter');

      this.activeFilter =
        this.parseTaskFilter(filter);

      this.loadTasks();
    }
  );
}
 get overdueTaskCount(): number {
  return this.tasks.filter(
    (task) => this.isOverdue(task)
  ).length;
}
  get filteredTasks(): UserTask[] {
    const searchValue = this.searchTerm
      .trim()
      .toLocaleLowerCase('tr-TR');

    return this.tasks.filter((task) => {
      const title = task.title
        .toLocaleLowerCase('tr-TR');

      const teamName = task.teamName
        .toLocaleLowerCase('tr-TR');

      const categoryName = task.categoryName
        .toLocaleLowerCase('tr-TR');

      const assigneeName =
        (task.assignedToUserName ?? '')
          .toLocaleLowerCase('tr-TR');

      const matchesSearch =
        !searchValue ||
        title.includes(searchValue) ||
        teamName.includes(searchValue) ||
        categoryName.includes(searchValue) ||
        assigneeName.includes(searchValue) ||
        task.id.toString().includes(searchValue);

      const matchesFilter =
        this.matchesStatusFilter(task);

      return matchesSearch && matchesFilter;
    });
  }

  get allTaskCount(): number {
    return this.tasks.length;
  }

  get openTaskCount(): number {
    return this.tasks.filter(
      (task) =>
        this.normalizeStatus(task.status) ===
        'open'
    ).length;
  }

  get inProgressTaskCount(): number {
    return this.tasks.filter(
      (task) =>
        this.normalizeStatus(task.status) ===
        'inProgress'
    ).length;
  }

  get completedTaskCount(): number {
    return this.tasks.filter(
      (task) =>
        this.normalizeStatus(task.status) ===
        'completed'
    ).length;
  }

  loadTasks(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.taskService
      .getMyTasks()
      .subscribe({
        next: (response: ApiTask[]) => {
          const taskList =
            Array.isArray(response)
              ? response
              : [];

          this.tasks = taskList
            .map((task) =>
              this.mapApiTask(task)
            )
            .sort((firstTask, secondTask) =>
              this.compareTasks(
                firstTask,
                secondTask
              )
            );

          this.isLoading = false;
        },

        error: (error: unknown) => {
          console.error(
            'Görevler yüklenemedi:',
            error
          );

          this.tasks = [];

          this.errorMessage =
            'Görevler yüklenirken bir hata oluştu.';

          this.isLoading = false;
        }
      });
  }

  setFilter(
    filter: TaskFilter
  ): void {
    this.activeFilter = filter;
  }

  clearSearch(): void {
    this.searchTerm = '';
  }

  openTask(
    task: UserTask
  ): void {
    if (!task.teamId || !task.id) {
      console.error(
        'Görev yönlendirme bilgileri eksik:',
        task
      );

      return;
    }

    localStorage.setItem(
      `teamName_${task.teamId}`,
      task.teamName
    );

    this.router.navigate([
      '/teams',
      task.teamId,
      'tasks',
      task.id
    ]);
  }

  openTeams(): void {
    this.router.navigate([
      '/teams'
    ]);
  }

  openReports(): void {
  this.router.navigate([
    '/dashboard'
  ]);
}

  getStatusLabel(
    status: number | string
  ): string {
    switch (
      this.normalizeStatus(status)
    ) {
      case 'open':
        return 'Açık';

      case 'inProgress':
        return 'Devam Ediyor';

      case 'completed':
        return 'Tamamlandı';

      default:
        return 'Bilinmiyor';
    }
  }

  getStatusClass(
    status: number | string
  ): string {
    switch (
      this.normalizeStatus(status)
    ) {
      case 'open':
        return 'status-open';

      case 'inProgress':
        return 'status-progress';

      case 'completed':
        return 'status-completed';

      default:
        return 'status-unknown';
    }
  }

  getPriorityLabel(
    priority: number | string
  ): string {
    switch (
      this.normalizePriority(priority)
    ) {
      case 'low':
        return 'Düşük';

      case 'medium':
        return 'Orta';

      case 'high':
        return 'Yüksek';

      default:
        return 'Belirsiz';
    }
  }

  getPrioritySymbol(
    priority: number | string
  ): string {
    switch (
      this.normalizePriority(priority)
    ) {
      case 'low':
        return '↓';

      case 'medium':
        return '=';

      case 'high':
        return '↑';

      default:
        return '•';
    }
  }

  getPriorityClass(
    priority: number | string
  ): string {
    switch (
      this.normalizePriority(priority)
    ) {
      case 'low':
        return 'priority-low';

      case 'medium':
        return 'priority-medium';

      case 'high':
        return 'priority-high';

      default:
        return 'priority-unknown';
    }
  }

  getAssigneeInitials(
    fullName?: string | null
  ): string {
    const value =
      fullName?.trim() ?? '';

    if (!value) {
      return '?';
    }

    const nameParts = value
      .split(/\s+/)
      .filter(Boolean);

    if (nameParts.length === 1) {
      return nameParts[0]
        .substring(0, 2)
        .toLocaleUpperCase('tr-TR');
    }

    return (
      nameParts[0].charAt(0) +
      nameParts[
        nameParts.length - 1
      ].charAt(0)
    ).toLocaleUpperCase('tr-TR');
  }

  getAssigneeColor(
    userId?: number | null
  ): string {
    const colors = [
      '#ff9f1c',
      '#ef3f18',
      '#10b981',
      '#4f8cff',
      '#7c5cff',
      '#ec4899'
    ];

    const id = userId ?? 0;

    return colors[
      Math.abs(id) %
      colors.length
    ];
  }

  trackByTaskId(
    index: number,
    task: UserTask
  ): number {
    return task.id;
  }

  private mapApiTask(
    task: ApiTask
  ): UserTask {
    return {
      id: task.id,
      title:
        task.title?.trim() ||
        'İsimsiz görev',

      description:
        task.description ?? null,

      teamId: task.teamId,

      teamName:
        task.teamName?.trim() ||
        'Takım belirtilmedi',

      categoryId:
        task.categoryId,

      categoryName:
        task.categoryName?.trim() ||
        'Kategori belirtilmedi',

      createdByUserId:
        task.createdByUserId,

      createdByName:
        task.createdByName ?? null,

      assignedToUserId:
        task.assignedToUserId ?? null,

      assignedToUserName:
        task.assignedToName ?? null,

      priority:
        task.priority,

      status:
        task.status,

      startDate:
        task.startDate ?? null,

      dueDate:
        task.dueDate ?? null,

      completedDate:
        task.completedDate ?? null,

      createdAt:
        task.createdAt ?? null,

      updatedAt:
        task.updatedAt ?? null
    };
  }

  private compareTasks(
    firstTask: UserTask,
    secondTask: UserTask
  ): number {
    const firstDate =
      firstTask.updatedAt ??
      firstTask.createdAt;

    const secondDate =
      secondTask.updatedAt ??
      secondTask.createdAt;

    const firstTime = firstDate
      ? new Date(firstDate).getTime()
      : 0;

    const secondTime = secondDate
      ? new Date(secondDate).getTime()
      : 0;

    return secondTime - firstTime;
  }

private matchesStatusFilter(
  task: UserTask
): boolean {
  switch (this.activeFilter) {
    case 'all':
      return true;

    case 'open':
      return (
        this.normalizeStatus(task.status) ===
        'open'
      );

    case 'inProgress':
      return (
        this.normalizeStatus(task.status) ===
        'inProgress'
      );

    case 'completed':
      return (
        this.normalizeStatus(task.status) ===
        'completed'
      );

    case 'overdue':
      return this.isOverdue(task);

    default:
      return true;
  }
}

  private normalizeStatus(
    status: number | string
  ): Exclude<TaskFilter, 'all'> | 'unknown' {
    if (typeof status === 'number') {
      switch (status) {
        case 0:
          return 'open';

        case 1:
          return 'inProgress';

        case 2:
          return 'completed';

        default:
          return 'unknown';
      }
    }

    const value = String(status)
      .trim()
      .toLocaleLowerCase('tr-TR')
      .replace(/\s+/g, '');

    if (
      value === '0' ||
      value === 'pending' ||
      value === 'todo' ||
      value === 'open' ||
      value === 'açık' ||
      value === 'acik'
    ) {
      return 'open';
    }

    if (
      value === '1' ||
      value === 'inprogress' ||
      value === 'devamediyor'
    ) {
      return 'inProgress';
    }

    if (
      value === '2' ||
      value === 'done' ||
      value === 'completed' ||
      value === 'tamamlandı' ||
      value === 'tamamlandi'
    ) {
      return 'completed';
    }

    return 'unknown';
  }
  private parseTaskFilter(
  filter: string | null
): TaskFilter {
  if (!filter) {
    return 'all';
  }

  const value = filter
    .trim()
    .toLocaleLowerCase('tr-TR');

  switch (value) {
    case 'all':
      return 'all';

    case 'pending':
    case 'todo':
    case 'open':
      return 'open';

    case 'inprogress':
      return 'inProgress';

    case 'completed':
    case 'done':
      return 'completed';

    case 'overdue':
      return 'overdue';

    default:
      return 'all';
  }
}

private isOverdue(
  task: UserTask
): boolean {
  if (!task.dueDate) {
    return false;
  }

  if (
    this.normalizeStatus(task.status) ===
    'completed'
  ) {
    return false;
  }

  const dueDate =
    new Date(task.dueDate);

  if (
    Number.isNaN(dueDate.getTime())
  ) {
    return false;
  }

  const today =
    new Date();

  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
}
  private normalizePriority(
    priority: number | string
  ): 'low' | 'medium' | 'high' | 'unknown' {
    if (typeof priority === 'number') {
      switch (priority) {
        case 0:
          return 'low';

        case 1:
          return 'medium';

        case 2:
          return 'high';

        default:
          return 'unknown';
      }
    }

    const value = String(priority)
      .trim()
      .toLocaleLowerCase('tr-TR');

    if (
      value === '0' ||
      value === 'low' ||
      value === 'düşük' ||
      value === 'dusuk'
    ) {
      return 'low';
    }

    if (
      value === '1' ||
      value === 'medium' ||
      value === 'orta'
    ) {
      return 'medium';
    }

    if (
      value === '2' ||
      value === 'high' ||
      value === 'yüksek' ||
      value === 'yuksek'
    ) {
      return 'high';
    }

    return 'unknown';
  }
}