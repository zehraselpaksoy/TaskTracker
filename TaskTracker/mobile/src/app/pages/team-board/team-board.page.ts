import { CommonModule } from '@angular/common';

import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDragPreview,
  CdkDropList,
  CdkDropListGroup,
  CdkDragMove
} from '@angular/cdk/drag-drop';

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
  closeOutline,
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

import { Team } from '../../models/team';

import { TeamService } from '../../services/teams';
import { TeamInvitationService } from '../../services/team-invitation';
import { SignalRService } from '../../services/signalr';
import {
  peopleOutline,
  personAddOutline
} from 'ionicons/icons';

interface CategoryOption {
  id: number;
  name: string;
}

interface TeamMemberOption {
  userId: number;
  fullName: string;
  role: string | number;
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

interface UpdateTaskStatusRequest {
  status: number;
}

@Component({
  selector: 'app-team-board',
  templateUrl: './team-board.page.html',
  styleUrls: ['./team-board.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    
    CdkDrag,
    CdkDragPreview,
    CdkDragPlaceholder,
    CdkDropList,
    CdkDropListGroup,

    IonContent,
    IonIcon,
    IonSpinner
  ]
})
export class TeamBoardPage implements OnInit, OnDestroy {
  @ViewChild(IonContent)
private ionContent!: IonContent;
@ViewChild('boardColumns')
private boardColumns?: ElementRef<HTMLDivElement>;

private isDragAutoScrolling = false;

private readonly taskApiUrl =
  `${environment.apiUrl}/tasks`;

private readonly categoryApiUrl =
  `${environment.apiUrl}/categories`;

  currentUserId = 0;

  isCurrentUserTeamLeader = false;

  removingMemberIds = new Set<number>();

  memberRemoveError = '';

  invitationEmail = '';

  isSendingInvitation = false;

  invitationError = '';

  invitationSuccessMessage = '';

  isBoardMenuOpen = false;

  isMembersModalOpen = false;

  isAddMemberModalOpen = false;

  teamId = 0;

  teamName = 'Takım yükleniyor...';

  activeTab: BoardTab = 'board';

  searchText = '';

  selectedAssigneeId: number | null = null;

  selectedPriority: TaskPriority | null = null;

  isAssigneeMenuOpen = false;

  isPriorityMenuOpen = false;

  isLoading = false;

  errorMessage = '';

  dragDropErrorMessage = '';

  isNavigationMenuOpen = false;

  isTeamMenuOpen = false;

  isTeamsLoading = false;

  teamMenuError = '';

  myTeams: Team[] = [];

  updatingTaskIds = new Set<number>();

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
    private readonly teamInvitationService: TeamInvitationService,
    private readonly http: HttpClient,
    private readonly signalRService: SignalRService
  ) {
    addIcons({
      addOutline,
      arrowBackOutline,
      calendarOutline,
      checkmarkCircleOutline,
      chevronDownOutline,
      closeOutline,
      ellipsisHorizontalOutline,
      gridOutline,
      listOutline,
      menuOutline,
      searchOutline,
      statsChartOutline,
      peopleOutline,
      personAddOutline
    });
  }

  ngOnInit(): void {
      this.currentUserId =
    this.getCurrentUserIdFromToken();

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

    void this.initializeSignalR();

    this.loadBoard();
  }

  ngOnDestroy(): void {
    this.signalRService
      .removeTaskStatusUpdated();

    if (this.teamId > 0) {
      void this.signalRService
        .leaveTeam(this.teamId)
        .catch(error => {
          console.error(
            'SignalR takım grubundan ayrılma hatası:',
            error
          );
        });
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    this.closeNavigationMenu();
    this.closeTeamMenu();
    this.closeAssigneeMenu();
    this.closePriorityMenu();
  }
  removeTeamMember(
  member: TeamMemberOption
): void {
  if (
    !this.isCurrentUserTeamLeader ||
    member.userId === this.currentUserId ||
    this.isRemovingMember(member.userId)
  ) {
    return;
  }

  const confirmed = window.confirm(
    `${member.fullName} adlı kullanıcı takımdan çıkarılsın mı?`
  );

  if (!confirmed) {
    return;
  }

  this.memberRemoveError = '';

  this.removingMemberIds.add(
    member.userId
  );

  this.teamService
    .removeMember(
      this.teamId,
      member.userId
    )
    .subscribe({
      next: () => {
        this.removingMemberIds.delete(
          member.userId
        );

        this.teamMembers =
          this.teamMembers.filter(
            item =>
              item.userId !== member.userId
          );

        this.updateCurrentUserTeamRole();
      },

      error: (
        error: HttpErrorResponse
      ) => {
        console.error(
          'Üye çıkarma hatası:',
          error
        );

        this.removingMemberIds.delete(
          member.userId
        );

        if (error.status === 403) {
          this.memberRemoveError =
            'Yalnızca takım lideri üye çıkarabilir.';

          return;
        }

        if (error.status === 404) {
          this.memberRemoveError =
            'Takım üyesi bulunamadı.';

          return;
        }

        this.memberRemoveError =
          this.extractBackendError(
            error,
            'Üye takımdan çıkarılamadı.'
          );
      }
    });
}
isRemovingMember(
  userId: number
): boolean {
  return this.removingMemberIds.has(
    userId
  );
}
getConnectedDropListIds(
  currentColumnId: TaskStatus
): string[] {
  return this.columns
    .filter(
      column =>
        column.id !== currentColumnId
    )
    .map(
      column =>
        `task-column-${column.id}`
    );
}
onTaskDragMoved(
  event: CdkDragMove<BoardTask>
): void {
  const pointerX =
    event.pointerPosition.x;

  const pointerY =
    event.pointerPosition.y;

  const screenWidth =
    window.innerWidth;

  const screenHeight =
    window.innerHeight;

  const horizontalEdgeDistance = 130;
  const verticalEdgeDistance = 100;

  /*
   * Yatay pano kaydırma
   */

const boardElement =
  this.boardColumns?.nativeElement;

if (boardElement) {
  let horizontalScrollAmount = 0;

  const fastEdgeDistance = 45;
  const slowScrollSpeed = 14;
  const fastScrollSpeed = 42;

  /*
   * Sol taraf
   */

  if (
    pointerX <
    horizontalEdgeDistance
  ) {
    if (
      pointerX <
      fastEdgeDistance
    ) {
      horizontalScrollAmount =
        -fastScrollSpeed;
    } else {
      horizontalScrollAmount =
        -slowScrollSpeed;
    }
  }

  /*
   * Sağ taraf
   */

  else if (
    pointerX >
    screenWidth -
      horizontalEdgeDistance
  ) {
    if (
      pointerX >
      screenWidth -
        fastEdgeDistance
    ) {
      horizontalScrollAmount =
        fastScrollSpeed;
    } else {
      horizontalScrollAmount =
        slowScrollSpeed;
    }
  }

  if (
    horizontalScrollAmount !== 0
  ) {
    boardElement.scrollBy({
      left:
        horizontalScrollAmount,

      behavior: 'auto'
    });
  }
}

  /*
   * Dikey sayfa kaydırma
   */

  if (
    !this.ionContent ||
    this.isDragAutoScrolling
  ) {
    return;
  }

  let verticalScrollAmount = 0;

  if (
    pointerY <
    verticalEdgeDistance
  ) {
    verticalScrollAmount = -14;
  } else if (
    pointerY >
    screenHeight -
      verticalEdgeDistance
  ) {
    verticalScrollAmount = 14;
  }

  if (
    verticalScrollAmount === 0
  ) {
    return;
  }

  this.isDragAutoScrolling = true;

  void this.ionContent
    .scrollByPoint(
      0,
      verticalScrollAmount,
      0
    )
    .finally(() => {
      this.isDragAutoScrolling =
        false;
    });
}
 private refreshTeamMembers(): void {
  this.teamService
    .getTeamById(this.teamId)
    .subscribe({
      next: team => {
        this.teamMembers =
          (team.members ?? []).map(
            member => ({
              userId: member.userId,
              fullName: member.fullName,
              role: member.role
            })
          );

        this.updateCurrentUserTeamRole();
      },

      error: (
        error: HttpErrorResponse
      ) => {
        console.error(
          'Takım üyeleri yenilenemedi:',
          error
        );
      }
    });
}

  loadBoard(): void {
  this.selectedPriority = null;
  this.selectedAssigneeId = null;
  this.searchText = '';

  this.isLoading = true;
  this.errorMessage = '';
  this.dragDropErrorMessage = '';

    forkJoin({
      team:
        this.teamService.getTeamById(
          this.teamId
        ),

      tasks:
        this.teamService.getTeamTasks(
          this.teamId
        )
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
  fullName: member.fullName,
  role: member.role
}));

this.updateCurrentUserTeamRole();

        this.tasks = tasks.map(
          task => this.mapBoardTask(task)
        );

        this.isLoading = false;
      },

      error: (
        error: HttpErrorResponse
      ) => {
        console.error(
          'Takım panosu yüklenemedi:',
          error
        );

        this.isLoading = false;

        if (error.status === 0) {
          this.errorMessage =
            'Backend sunucusuna ulaşılamadı.';

          return;
        }

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

 selectNavigationTab(
  tab: BoardTab
): void {
  this.closeNavigationMenu();
  this.setActiveTab(tab);
}
  onNavigationBackdropClick(): void {
    this.closeNavigationMenu();
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
        next: teams => {
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

    const previousTeamId =
      this.teamId;

    this.closeAllMenus();

    this.searchText = '';

    this.selectedAssigneeId = null;

    this.selectedPriority = null;

    this.errorMessage = '';

    this.dragDropErrorMessage = '';

    this.tasks = [];

    this.teamMembers = [];

    this.teamId = team.id;

    this.teamName = team.name;

    try {
      if (previousTeamId > 0) {
        await this.signalRService
          .leaveTeam(previousTeamId);
      }
    } catch (error) {
      console.error(
        'Eski SignalR takım grubundan ayrılma hatası:',
        error
      );
    }

    const navigationSucceeded =
      await this.router.navigate([
        '/teams',
        team.id
      ]);

    if (!navigationSucceeded) {
      console.error(
        'Yeni takım adresine geçilemedi.'
      );
    }

    await this.initializeSignalR();

    this.loadBoard();
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
   * Atanan filtresi
   */

  openAssigneeMenu(): void {
    const willOpen =
      !this.isAssigneeMenuOpen;

    this.closeAllMenus();

    this.isAssigneeMenuOpen =
      willOpen;
  }

  closeAssigneeMenu(): void {
    this.isAssigneeMenuOpen = false;
  }

  selectAssignee(
    userId: number | null
  ): void {
    this.selectedAssigneeId =
      userId;

    this.closeAssigneeMenu();
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

  /*
   * Öncelik filtresi
   */

  openPriorityMenu(): void {
    const willOpen =
      !this.isPriorityMenuOpen;

    this.closeAllMenus();

    this.isPriorityMenuOpen =
      willOpen;
  }

  closePriorityMenu(): void {
    this.isPriorityMenuOpen = false;
  }

  selectPriority(
    priority: TaskPriority | null
  ): void {
    this.selectedPriority =
      priority;

    this.closePriorityMenu();
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

  /*
   * Görev sürükle-bırak
   */

  dropTask(
  event: CdkDragDrop<BoardTask[]>,
  newStatus: TaskStatus
): void {
  this.dragDropErrorMessage = '';

  /*
   * Önce cdkDragData okunur.
   * Boş gelirse görev önceki sütunun
   * verisinden alınır.
   */
  const draggedTask =
    (
      event.item.data as
        BoardTask | undefined
    ) ??
    event.previousContainer
      .data[event.previousIndex];

  if (!draggedTask) {
    this.dragDropErrorMessage =
      'Taşınan görev bilgisi okunamadı.';

    console.error(
      'Sürüklenen görev okunamadı:',
      {
        previousContainer:
          event.previousContainer.id,

        currentContainer:
          event.container.id,

        previousIndex:
          event.previousIndex,

        currentIndex:
          event.currentIndex
      }
    );

    return;
  }

  const oldStatus =
    draggedTask.status;

  
  if (
    this.isTaskStatusUpdating(
      draggedTask.id
    )
  ) {
    return;
  }

  if (oldStatus === newStatus) {
    return;
  }

  /*
   * Arayüzü beklemeden güncelle.
   */

  this.tasks =
    this.tasks.map(task => {
      if (
        task.id !== draggedTask.id
      ) {
        return task;
      }

      return {
        ...task,
        status: newStatus
      };
    });

  /*
   * Değişikliği backend'e gönder.
   * İstek başarısız olursa updateTaskStatus
   * görevi eski sütununa geri alır.
   */

  this.updateTaskStatus(
    draggedTask.id,
    oldStatus,
    newStatus
  );
}

  isTaskStatusUpdating(
    taskId: number
  ): boolean {
    return this.updatingTaskIds.has(
      taskId
    );
  }

  openTask(
    task: BoardTask
  ): void {
    if (
      this.isTaskStatusUpdating(
        task.id
      )
    ) {
      return;
    }

    void this.router.navigate([
      '/teams',
      this.teamId,
      'tasks',
      task.id
    ]);
  }

  /*
   * Görev oluşturma
   */

  openCreateTask(
    status: TaskStatus = 'todo'
  ): void {
    console.log(
      'Görev şu sütundan oluşturuluyor:',
      status
    );

    this.closeAllMenus();

    this.createTaskError = '';

    this.createTaskForm =
      this.getEmptyCreateTaskForm();

    this.isCreateTaskModalOpen = true;

    if (
      this.categories.length === 0
    ) {
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

        this.isCreateTaskModalOpen =
          false;

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
setActiveTab(
  tab: BoardTab
): void {
  (document.activeElement as HTMLElement | null)?.blur();

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

 openBoardMenu(): void {
  this.closeAssigneeMenu();
  this.closePriorityMenu();

  this.isBoardMenuOpen =
    !this.isBoardMenuOpen;
}

closeBoardMenu(): void {
  this.isBoardMenuOpen = false;
}

openMembersModal(): void {
  this.closeBoardMenu();
  this.isMembersModalOpen = true;
}

closeMembersModal(): void {
  this.isMembersModalOpen = false;
}

openAddMemberModal(): void {
  this.closeBoardMenu();

  this.invitationEmail = '';
  this.invitationError = '';
  this.invitationSuccessMessage = '';

  this.isAddMemberModalOpen = true;
}

closeAddMemberModal(): void {
  if (this.isSendingInvitation) {
    return;
  }

  this.isAddMemberModalOpen = false;

  this.invitationEmail = '';
  this.invitationError = '';
  this.invitationSuccessMessage = '';
}

sendTeamInvitation(): void {
  if (this.isSendingInvitation) {
    return;
  }

  const email = this.invitationEmail
    .trim()
    .toLowerCase();

  this.invitationError = '';
  this.invitationSuccessMessage = '';

  if (!email) {
    this.invitationError =
      'E-posta adresi boş bırakılamaz.';

    return;
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    this.invitationError =
      'Geçerli bir e-posta adresi girin.';

    return;
  }

  this.isSendingInvitation = true;

  this.teamInvitationService
    .sendInvitation(
      this.teamId,
      {
        email
      }
    )
    .subscribe({
      next: response => {
        this.isSendingInvitation = false;

        this.invitationSuccessMessage =
          response.message;

        this.invitationEmail = '';
      },

      error: (
        error: HttpErrorResponse
      ) => {
        console.error(
          'Takım daveti gönderme hatası:',
          error
        );

        this.isSendingInvitation = false;

        if (error.status === 0) {
          this.invitationError =
            'Backend sunucusuna ulaşılamadı.';

          return;
        }

        if (error.status === 401) {
          this.invitationError =
            'Oturumunuz sona ermiş olabilir.';

          return;
        }

        if (error.status === 403) {
          this.invitationError =
            'Yalnızca takım üyeleri davet gönderebilir.';

          return;
        }

        if (error.status === 404) {
          this.invitationError =
            'Takım bulunamadı.';

          return;
        }

        this.invitationError =
          this.extractBackendError(
            error,
            'Takım daveti gönderilemedi.'
          );
      }
    });
}

  /*
   * Görev filtreleme
   */

  getTasksByStatus(
  status: TaskStatus
): BoardTask[] {
  const normalizedSearch =
    this.searchText
      .trim()
      .toLocaleLowerCase('tr-TR');

  return this.tasks.filter(task => {
    const normalizedTitle =
      task.title
        .trim()
        .toLocaleLowerCase('tr-TR');

    const matchesStatus =
      task.status === status;

    const taskAssigneeId =
      task.assignedToUserId === null ||
      task.assignedToUserId === undefined
        ? null
        : Number(
            task.assignedToUserId
          );

    const matchesAssignee =
      this.selectedAssigneeId === null ||
      taskAssigneeId ===
        Number(
          this.selectedAssigneeId
        );

    const matchesPriority =
      this.selectedPriority === null ||
      task.priority ===
        this.selectedPriority;

    const matchesSearch =
      !normalizedSearch ||
      normalizedTitle.startsWith(
        normalizedSearch
      );

    return (
      matchesStatus &&
      matchesAssignee &&
      matchesPriority &&
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

  /*
   * Yardımcı metotlar
   */

  private closeAllMenus(): void {
    this.closeNavigationMenu();
    this.closeTeamMenu();
    this.closeAssigneeMenu();
    this.closePriorityMenu();
  }

  private updateTaskStatus(
    taskId: number,
    oldStatus: TaskStatus,
    newStatus: TaskStatus
  ): void {
    const request:
      UpdateTaskStatusRequest = {
        status:
          this.mapTaskStatusToApi(
            newStatus
          )
      };

    this.updatingTaskIds.add(
      taskId
    );

    this.http.patch(
      `${this.taskApiUrl}/${taskId}/status`,
      request,
      {
        responseType: 'text'
      }
    ).subscribe({
      next: response => {
        console.log(
          'Görev durumu sürükle-bırak ile güncellendi:',
          response
        );

        this.updatingTaskIds.delete(
          taskId
        );
      },

      error: (
        error: HttpErrorResponse
      ) => {
        console.error(
          'Görev durumu güncellenemedi:',
          error
        );

        this.updatingTaskIds.delete(
          taskId
        );

        this.tasks =
          this.tasks.map(task => {
            if (
              task.id !== taskId
            ) {
              return task;
            }

            return {
              ...task,
              status: oldStatus
            };
          });

        this.dragDropErrorMessage =
          this.getStatusUpdateErrorMessage(
            error
          );
      }
    });
  }

  private mapTaskStatusToApi(
    status: TaskStatus
  ): number {
    const statusMap:
      Record<TaskStatus, number> = {
        todo: 0,
        inProgress: 1,
        done: 2
      };

    return statusMap[status];
  }

  private getStatusUpdateErrorMessage(
    error: HttpErrorResponse
  ): string {
    if (error.status === 0) {
      return 'Backend sunucusuna ulaşılamadığı için görev eski sütununa taşındı.';
    }

    if (error.status === 400) {
      return this.extractBackendError(
        error,
        'Görev durumu geçersiz olduğu için görev eski sütununa taşındı.'
      );
    }

    if (error.status === 401) {
      return 'Oturumunuz sona erdiği için görev durumu güncellenemedi.';
    }

    if (error.status === 403) {
      return 'Bu görevin durumunu değiştirme yetkiniz bulunmuyor.';
    }

    if (error.status === 404) {
      return 'Görev bulunamadığı için durum güncellenemedi.';
    }

    return this.extractBackendError(
      error,
      'Görev durumu güncellenemedi ve görev eski sütununa taşındı.'
    );
  }

  private loadCategories(): void {
    this.http.get<CategoryOption[]>(
      this.categoryApiUrl
    ).subscribe({
      next: categories => {
        this.categories =
          categories;

        if (
          categories.length === 1 &&
          this.createTaskForm
            .categoryId === 0
        ) {
          this.createTaskForm
            .categoryId =
            categories[0].id;
        }
      },

      error: (
        error: HttpErrorResponse
      ) => {
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

    const date =
      new Date(dueDate);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
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
      typeof error.error ===
        'string' &&
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
        if (
          typeof value === 'string'
        ) {
          messages.push(value);

          return;
        }

        if (Array.isArray(value)) {
          value.forEach(
            (
              message: unknown
            ) => {
              if (
                typeof message ===
                  'string'
              ) {
                messages.push(
                  message
                );
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

   getInitials(
    fullName: string | null
  ): string {
    if (!fullName) {
      return '?';
    }

    const nameParts =
      fullName
        .trim()
        .split(/\s+/)
        .filter(
          part =>
            part.length > 0
        );

    if (
      nameParts.length === 0
    ) {
      return '?';
    }

    if (
      nameParts.length === 1
    ) {
      return nameParts[0]
        .charAt(0)
        .toLocaleUpperCase(
          'tr-TR'
        );
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
    ).toLocaleUpperCase(
      'tr-TR'
    );
  }

  private mapTaskStatus(
    status: string | number
  ): TaskStatus {
    if (
      typeof status === 'number'
    ) {
      const statusMap:
        Record<number, TaskStatus> = {
          0: 'todo',
          1: 'inProgress',
          2: 'done'
        };

      return (
        statusMap[status] ??
        'todo'
      );
    }

    const normalizedStatus =
      status
        .trim()
        .replace(
          /[\s_-]/g,
          ''
        )
        .toLocaleLowerCase(
          'tr-TR'
        );

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
      statusMap[
        normalizedStatus
      ] ??
      'todo'
    );
  }

  private mapTaskPriority(
    priority: string | number
  ): TaskPriority {
    if (
      typeof priority === 'number'
    ) {
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
        .replace(
          /[\s_-]/g,
          ''
        )
        .toLocaleLowerCase(
          'tr-TR'
        );

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
      priorityMap[
        normalizedPriority
      ] ??
      'medium'
    );
  }

  private async initializeSignalR():
    Promise<void> {
    try {
      await this.signalRService
        .startConnection();

      await this.signalRService
        .joinTeam(
          this.teamId
        );

      this.signalRService
        .removeTaskStatusUpdated();

      this.signalRService
        .onTaskStatusUpdated(
          data => {
            console.log(
              'TaskStatusUpdated:',
              data
            );

            const eventTeamId =
              Number(data.teamId);

            const eventTaskId =
              Number(data.taskId);

            if (
              eventTeamId !==
                this.teamId ||
              Number.isNaN(
                eventTaskId
              )
            ) {
              return;
            }

            const newStatus =
              this.mapTaskStatus(
                data.status
              );

            this.tasks =
              this.tasks.map(
                task => {
                  if (
                    task.id !==
                    eventTaskId
                  ) {
                    return task;
                  }

                  return {
                    ...task,
                    status:
                      newStatus
                  };
                }
              );
          }
        );
    } catch (error) {
      console.error(
        'SignalR bağlantısı kurulamadı:',
        error
      );
    }
  }
  private updateCurrentUserTeamRole(): void {
  const currentMembership =
    this.teamMembers.find(
      member =>
        member.userId ===
        this.currentUserId
    );

  this.isCurrentUserTeamLeader =
    currentMembership !== undefined &&
    this.isLeaderRole(
      currentMembership.role
    );
}

private isLeaderRole(
  role: string | number
): boolean {
  if (typeof role === 'number') {
    return role === 2;
  }

  const normalizedRole = role
    .trim()
    .toLocaleLowerCase('tr-TR');

  return (
    normalizedRole === 'leader' ||
    normalizedRole === 'lider' ||
    normalizedRole === '2'
  );
}

private getCurrentUserIdFromToken(): number {
  const token =
    localStorage.getItem('token');

  if (!token) {
    return 0;
  }

  try {
    const tokenParts =
      token.split('.');

    if (tokenParts.length !== 3) {
      return 0;
    }

    let base64 = tokenParts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    while (base64.length % 4 !== 0) {
      base64 += '=';
    }

    const payload = JSON.parse(
      atob(base64)
    ) as Record<string, unknown>;

    const nameIdentifierClaim =
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';

    const userIdValue =
      payload[nameIdentifierClaim] ??
      payload['nameid'] ??
      payload['sub'];

    const userId = Number(userIdValue);

    return Number.isNaN(userId)
      ? 0
      : userId;
  } catch (error) {
    console.error(
      'Kullanıcı kimliği JWT üzerinden okunamadı:',
      error
    );

    return 0;
  }
}
}