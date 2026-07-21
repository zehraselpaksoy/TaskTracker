import { CommonModule } from '@angular/common';

import {
  Component,
  ElementRef,
  OnInit,
  ViewChild
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
  arrowBackOutline,
  attachOutline,
  calendarOutline,
  chatbubbleOutline,
  chevronDownOutline,
  closeOutline,
  createOutline,
  documentOutline,
  downloadOutline,
  pricetagOutline,
  saveOutline,
  sendOutline,
  trashOutline
} from 'ionicons/icons';

interface TaskDetailResponse {
  id: number;
  title: string;
  description: string | null;
  priority: number | string;
  status: number | string;
  startDate: string | null;
  dueDate: string | null;
  completedDate: string | null;
  createdAt: string;
  updatedAt: string | null;
  categoryId: number;
  categoryName: string;
  createdByUserId: number;
  createdByName: string;
  assignedToUserId: number | null;
  assignedToName: string | null;
  teamId: number;
  teamName: string;
}

interface CommentAttachment {
  id: number;
  originalFileName: string;
  objectKey: string;
  contentType: string;
  fileSize: number;
  downloadUrl: string;
  createdAt: string;
}

interface TaskComment {
  id: number;
  content: string;
  userId: number;
  userFullName: string;
  createdAt: string;
  attachments: CommentAttachment[];
}

interface TaskStatusOption {
  value: number;
  label: string;
  cssClass: string;
}

type TaskPriority =
  | 'low'
  | 'medium'
  | 'high';

@Component({
  selector: 'app-task-detail',
  templateUrl: './task-detail.page.html',
  styleUrls: ['./task-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonIcon,
    IonSpinner
  ]
})
export class TaskDetailPage implements OnInit {

  @ViewChild('commentFileInput')
  commentFileInput?: ElementRef<HTMLInputElement>;

  private readonly apiBaseUrl =
    'https://localhost:7164/api';

  teamId = 0;

  taskId = 0;

  task: TaskDetailResponse | null = null;

  isLoading = false;

  errorMessage = '';

  /*
   * Görev durumu
   */

  isStatusMenuOpen = false;

  isUpdatingStatus = false;

  statusErrorMessage = '';

  /*
   * Görev açıklaması
   */

  isEditingDescription = false;

  editedDescription = '';

  isSavingDescription = false;

  descriptionErrorMessage = '';

  /*
   * Yorumlar
   */

  comments: TaskComment[] = [];

  isLoadingComments = false;

  commentsErrorMessage = '';

  newCommentContent = '';

  selectedCommentFiles: File[] = [];

  isCreatingComment = false;

  createCommentErrorMessage = '';

  editingCommentId: number | null = null;

  editedCommentContent = '';

  isUpdatingComment = false;

  updateCommentErrorMessage = '';

  deletingCommentId: number | null = null;

  deletingAttachmentId: number | null = null;

  readonly statusOptions:
    TaskStatusOption[] = [
      {
        value: 0,
        label: 'Yapılacak',
        cssClass: 'pending'
      },
      {
        value: 1,
        label: 'Devam Ediyor',
        cssClass: 'in-progress'
      },
      {
        value: 2,
        label: 'Tamamlandı',
        cssClass: 'completed'
      }
    ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly http: HttpClient
  ) {
    addIcons({
      arrowBackOutline,
      attachOutline,
      calendarOutline,
      chatbubbleOutline,
      chevronDownOutline,
      closeOutline,
      createOutline,
      documentOutline,
      downloadOutline,
      pricetagOutline,
      saveOutline,
      sendOutline,
      trashOutline
    });
  }

  ngOnInit(): void {
    this.readRouteParameters();
  }

  /*
   * Görev işlemleri
   */

  loadTask(): void {
    if (this.taskId <= 0) {
      this.errorMessage =
        'Geçersiz görev kimliği.';

      return;
    }

    this.isLoading = true;

    this.errorMessage = '';

    this.http.get<TaskDetailResponse>(
      `${this.apiBaseUrl}/tasks/${this.taskId}`
    ).subscribe({
      next: task => {
        if (
          this.teamId > 0 &&
          task.teamId !== this.teamId
        ) {
          this.isLoading = false;

          this.errorMessage =
            'Bu görev seçilen takıma ait değil.';

          return;
        }

        this.task = task;

        this.editedDescription =
          task.description ?? '';

        this.isLoading = false;
      },

      error: (
        error: HttpErrorResponse
      ) => {
        console.error(
          'Görev detayları yüklenemedi:',
          error
        );

        this.isLoading = false;

        this.errorMessage =
          this.getApiErrorMessage(
            error,
            'Görev detayları yüklenirken bir hata oluştu.'
          );
      }
    });
  }

  goBack(): void {
    if (this.teamId > 0) {
      this.router.navigate([
        '/teams',
        this.teamId
      ]);

      return;
    }

    this.router.navigate([
      '/teams'
    ]);
  }

  retry(): void {
    this.loadTask();
    this.loadComments();
  }

  /*
   * Durum işlemleri
   */

  toggleStatusMenu(): void {
    if (
      !this.task ||
      this.isUpdatingStatus
    ) {
      return;
    }

    this.statusErrorMessage = '';

    this.isStatusMenuOpen =
      !this.isStatusMenuOpen;
  }

  closeStatusMenu(): void {
    this.isStatusMenuOpen = false;
  }

  updateStatus(
    option: TaskStatusOption
  ): void {
    if (
      !this.task ||
      this.isUpdatingStatus
    ) {
      return;
    }

    const currentStatus =
      this.getNumericStatus(
        this.task.status
      );

    if (
      currentStatus ===
      option.value
    ) {
      this.isStatusMenuOpen = false;

      return;
    }

    this.isUpdatingStatus = true;

    this.statusErrorMessage = '';

    this.http.patch(
      `${this.apiBaseUrl}/tasks/${this.taskId}/status`,
      {
        status: option.value
      },
      {
        responseType: 'text'
      }
    ).subscribe({
      next: () => {
        if (this.task) {
          this.task = {
            ...this.task,

            status: option.value,

            completedDate:
              option.value === 2
                ? new Date().toISOString()
                : null,

            updatedAt:
              new Date().toISOString()
          };
        }

        this.isUpdatingStatus = false;

        this.isStatusMenuOpen = false;
      },

      error: (
        error: HttpErrorResponse
      ) => {
        console.error(
          'Görev durumu güncellenemedi:',
          error
        );

        this.isUpdatingStatus = false;

        this.statusErrorMessage =
          this.getApiErrorMessage(
            error,
            'Görev durumu güncellenirken bir hata oluştu.'
          );
      }
    });
  }

  /*
   * Açıklama işlemleri
   */

  startDescriptionEdit(): void {
    if (
      !this.task ||
      this.isSavingDescription
    ) {
      return;
    }

    this.editedDescription =
      this.task.description ?? '';

    this.descriptionErrorMessage = '';

    this.isEditingDescription = true;
  }

  cancelDescriptionEdit(): void {
    if (this.isSavingDescription) {
      return;
    }

    this.editedDescription =
      this.task?.description ?? '';

    this.descriptionErrorMessage = '';

    this.isEditingDescription = false;
  }

  saveDescription(): void {
  if (!this.task || this.isSavingDescription) {
    return;
  }

  const description = this.editedDescription.trim();

  this.isSavingDescription = true;
  this.descriptionErrorMessage = '';

  this.http.put(
    `${this.apiBaseUrl}/tasks/${this.taskId}`,
    {
      title: this.task.title,
      description: description || null,
      priority: this.getNumericPriority(this.task.priority),
      categoryId: this.task.categoryId,
      assignedToUserId: this.task.assignedToUserId
    },
    {
      responseType: 'text'
    }
  ).subscribe({
    next: () => {
      if (this.task) {
        this.task = {
          ...this.task,
          description: description || null,
          updatedAt: new Date().toISOString()
        };
      }

      this.isSavingDescription = false;
      this.isEditingDescription = false;
    },

    error: (error: HttpErrorResponse) => {
      console.error(
        'Görev açıklaması güncellenemedi:',
        error
      );

      this.isSavingDescription = false;

      this.descriptionErrorMessage =
        this.getApiErrorMessage(
          error,
          'Görev açıklaması güncellenirken bir hata oluştu.'
        );
    }
  });
}

  /*
   * Yorumları getirme
   */

  loadComments(): void {
    if (this.taskId <= 0) {
      return;
    }

    this.isLoadingComments = true;

    this.commentsErrorMessage = '';

    this.http.get<TaskComment[]>(
      `${this.apiBaseUrl}/tasks/${this.taskId}/comments`
    ).subscribe({
      next: comments => {
        this.comments =
          [...comments].sort(
            (
              firstComment,
              secondComment
            ) =>
              new Date(
                firstComment.createdAt
              ).getTime() -
              new Date(
                secondComment.createdAt
              ).getTime()
          );

        this.isLoadingComments = false;
      },

      error: (
        error: HttpErrorResponse
      ) => {
        console.error(
          'Yorumlar yüklenemedi:',
          error
        );

        this.isLoadingComments = false;

        this.commentsErrorMessage =
          this.getApiErrorMessage(
            error,
            'Yorumlar yüklenirken bir hata oluştu.'
          );
      }
    });
  }

  retryComments(): void {
    this.loadComments();
  }

  /*
   * Yeni yorum
   */

  onCommentFilesSelected(
    event: Event
  ): void {
    const input =
      event.target as HTMLInputElement;

    if (
      !input.files ||
      input.files.length === 0
    ) {
      return;
    }

    const incomingFiles =
      Array.from(input.files);

    const existingFileKeys =
      new Set(
        this.selectedCommentFiles.map(
          file =>
            `${file.name}-${file.size}-${file.lastModified}`
        )
      );

    incomingFiles.forEach(file => {
      const fileKey =
        `${file.name}-${file.size}-${file.lastModified}`;

      if (
        !existingFileKeys.has(fileKey)
      ) {
        this.selectedCommentFiles.push(
          file
        );

        existingFileKeys.add(fileKey);
      }
    });

    input.value = '';
  }

  removeSelectedCommentFile(
    index: number
  ): void {
    if (
      this.isCreatingComment
    ) {
      return;
    }

    this.selectedCommentFiles.splice(
      index,
      1
    );
  }

  createComment(): void {
    if (this.isCreatingComment) {
      return;
    }

    const content =
      this.newCommentContent.trim();

    if (!content) {
      this.createCommentErrorMessage =
        'Yorum metni boş bırakılamaz.';

      return;
    }

    const formData =
      new FormData();

    formData.append(
      'Content',
      content
    );

    this.selectedCommentFiles.forEach(
      file => {
        formData.append(
          'Files',
          file,
          file.name
        );
      }
    );

    this.isCreatingComment = true;

    this.createCommentErrorMessage = '';

    this.http.post<TaskComment>(
      `${this.apiBaseUrl}/tasks/${this.taskId}/comments`,
      formData
    ).subscribe({
      next: createdComment => {
        this.comments.push(
          createdComment
        );

        this.newCommentContent = '';

        this.selectedCommentFiles = [];

        if (
          this.commentFileInput
        ) {
          this.commentFileInput
            .nativeElement
            .value = '';
        }

        this.isCreatingComment = false;
      },

      error: (
        error: HttpErrorResponse
      ) => {
        console.error(
          'Yorum eklenemedi:',
          error
        );

        this.isCreatingComment = false;

        this.createCommentErrorMessage =
          this.getApiErrorMessage(
            error,
            'Yorum eklenirken bir hata oluştu.'
          );
      }
    });
  }

  /*
   * Yorum düzenleme
   */

  startCommentEdit(
    comment: TaskComment
  ): void {
    if (
      this.isUpdatingComment ||
      this.deletingCommentId !== null
    ) {
      return;
    }

    this.editingCommentId =
      comment.id;

    this.editedCommentContent =
      comment.content;

    this.updateCommentErrorMessage = '';
  }

  cancelCommentEdit(): void {
    if (this.isUpdatingComment) {
      return;
    }

    this.editingCommentId = null;

    this.editedCommentContent = '';

    this.updateCommentErrorMessage = '';
  }

  updateComment(
    comment: TaskComment
  ): void {
    if (
      this.isUpdatingComment ||
      this.editingCommentId !==
        comment.id
    ) {
      return;
    }

    const content =
      this.editedCommentContent.trim();

    if (!content) {
      this.updateCommentErrorMessage =
        'Yorum metni boş bırakılamaz.';

      return;
    }

    this.isUpdatingComment = true;

    this.updateCommentErrorMessage = '';

    this.http.put<TaskComment>(
      `${this.apiBaseUrl}/comments/${comment.id}`,
      {
        content
      }
    ).subscribe({
      next: updatedComment => {
        const commentIndex =
          this.comments.findIndex(
            currentComment =>
              currentComment.id ===
              comment.id
          );

        if (commentIndex !== -1) {
          this.comments[
            commentIndex
          ] = updatedComment;
        }

        this.isUpdatingComment = false;

        this.editingCommentId = null;

        this.editedCommentContent = '';
      },

      error: (
        error: HttpErrorResponse
      ) => {
        console.error(
          'Yorum güncellenemedi:',
          error
        );

        this.isUpdatingComment = false;

        this.updateCommentErrorMessage =
          this.getApiErrorMessage(
            error,
            'Yorum güncellenirken bir hata oluştu.'
          );
      }
    });
  }

  /*
   * Yorum silme
   */

  deleteComment(
    comment: TaskComment
  ): void {
    if (
      this.deletingCommentId !== null ||
      this.isUpdatingComment
    ) {
      return;
    }

    const shouldDelete =
      window.confirm(
        'Bu yorumu silmek istediğinize emin misiniz?'
      );

    if (!shouldDelete) {
      return;
    }

    this.deletingCommentId =
      comment.id;

    this.commentsErrorMessage = '';

    this.http.delete<void>(
      `${this.apiBaseUrl}/comments/${comment.id}`
    ).subscribe({
      next: () => {
        this.comments =
          this.comments.filter(
            currentComment =>
              currentComment.id !==
              comment.id
          );

        if (
          this.editingCommentId ===
          comment.id
        ) {
          this.cancelCommentEdit();
        }

        this.deletingCommentId = null;
      },

      error: (
        error: HttpErrorResponse
      ) => {
        console.error(
          'Yorum silinemedi:',
          error
        );

        this.deletingCommentId = null;

        this.commentsErrorMessage =
          this.getApiErrorMessage(
            error,
            'Yorum silinirken bir hata oluştu.'
          );
      }
    });
  }

  isDeletingComment(
    commentId: number
  ): boolean {
    return (
      this.deletingCommentId ===
      commentId
    );
  }

  /*
   * Yorum dosyaları
   */

  openAttachment(
    attachment: CommentAttachment
  ): void {
    if (!attachment.downloadUrl) {
      return;
    }

    window.open(
      attachment.downloadUrl,
      '_blank',
      'noopener,noreferrer'
    );
  }

  deleteAttachment(
    comment: TaskComment,
    attachment: CommentAttachment
  ): void {
    if (
      this.deletingAttachmentId !==
      null
    ) {
      return;
    }

    const shouldDelete =
      window.confirm(
        `"${attachment.originalFileName}" dosyasını silmek istediğinize emin misiniz?`
      );

    if (!shouldDelete) {
      return;
    }

    this.deletingAttachmentId =
      attachment.id;

    this.commentsErrorMessage = '';

    this.http.delete<void>(
      `${this.apiBaseUrl}/attachments/${attachment.id}`
    ).subscribe({
      next: () => {
        comment.attachments =
          comment.attachments.filter(
            currentAttachment =>
              currentAttachment.id !==
              attachment.id
          );

        this.deletingAttachmentId = null;
      },

      error: (
        error: HttpErrorResponse
      ) => {
        console.error(
          'Dosya silinemedi:',
          error
        );

        this.deletingAttachmentId = null;

        this.commentsErrorMessage =
          this.getApiErrorMessage(
            error,
            'Dosya silinirken bir hata oluştu.'
          );
      }
    });
  }

  isDeletingAttachment(
    attachmentId: number
  ): boolean {
    return (
      this.deletingAttachmentId ===
      attachmentId
    );
  }

  /*
   * Görünüm yardımcıları
   */

  getTaskKey(): string {
    if (!this.task) {
      return '';
    }

    return `TASK-${this.task.id}`;
  }

  getStatusLabel(
    status: number | string
  ): string {
    const numericStatus =
      this.getNumericStatus(status);

    const option =
      this.statusOptions.find(
        item =>
          item.value ===
          numericStatus
      );

    return (
      option?.label ??
      'Bilinmeyen durum'
    );
  }

  getStatusCssClass(
    status: number | string
  ): string {
    const numericStatus =
      this.getNumericStatus(status);

    const option =
      this.statusOptions.find(
        item =>
          item.value ===
          numericStatus
      );

    return (
      option?.cssClass ??
      'pending'
    );
  }

  isCurrentStatus(
    statusValue: number
  ): boolean {
    if (!this.task) {
      return false;
    }

    return (
      this.getNumericStatus(
        this.task.status
      ) === statusValue
    );
  }

  getPriority(): TaskPriority {
    if (!this.task) {
      return 'medium';
    }

    return this.mapPriority(
      this.task.priority
    );

  }
private getNumericPriority(
  priority: string | number
): number {
  if (typeof priority === 'number') {
    return priority;
  }

  const numericPriority = Number(priority);

  if (Number.isFinite(numericPriority)) {
    return numericPriority;
  }

  const normalizedPriority = priority
    .trim()
    .toLocaleLowerCase('tr-TR');

  switch (normalizedPriority) {
    case 'low':
    case 'düşük':
    case 'dusuk':
      return 0;

    case 'medium':
    case 'orta':
      return 1;

    case 'high':
    case 'yüksek':
    case 'yuksek':
      return 2;

    default:
      return 1;
  }
}
  getPriorityLabel(): string {
    const labels:
      Record<TaskPriority, string> = {
        low: 'Düşük',
        medium: 'Orta',
        high: 'Yüksek'
      };

    return labels[
      this.getPriority()
    ];
  }

  getPrioritySymbol(): string {
    const symbols:
      Record<TaskPriority, string> = {
        low: '↓',
        medium: '=',
        high: '↑'
      };

    return symbols[
      this.getPriority()
    ];
  }

  getAssigneeInitials(): string {
    return this.getInitials(
      this.task?.assignedToName ??
      null
    );
  }

  getCommentInitials(
    comment: TaskComment
  ): string {
    return this.getInitials(
      comment.userFullName
    );
  }

  formatDate(
    dateValue: string | null
  ): string {
    if (!dateValue) {
      return 'Belirtilmedi';
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return 'Belirtilmedi';
    }

    return new Intl.DateTimeFormat(
      'tr-TR',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    ).format(date);
  }

  formatCommentDate(
    dateValue: string
  ): string {
    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return '';
    }

    return new Intl.DateTimeFormat(
      'tr-TR',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    ).format(date);
  }

  formatFileSize(
    fileSize: number
  ): string {
    if (
      !Number.isFinite(fileSize) ||
      fileSize <= 0
    ) {
      return '0 B';
    }

    const units = [
      'B',
      'KB',
      'MB',
      'GB'
    ];

    const unitIndex =
      Math.min(
        Math.floor(
          Math.log(fileSize) /
          Math.log(1024)
        ),
        units.length - 1
      );

    const size =
      fileSize /
      Math.pow(
        1024,
        unitIndex
      );

    return `${size.toFixed(
      unitIndex === 0 ? 0 : 1
    )} ${units[unitIndex]}`;
  }

  trackComment(
    index: number,
    comment: TaskComment
  ): number {
    return comment.id;
  }

  trackAttachment(
    index: number,
    attachment: CommentAttachment
  ): number {
    return attachment.id;
  }

  trackSelectedFile(
    index: number,
    file: File
  ): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  trackStatusOption(
    index: number,
    option: TaskStatusOption
  ): number {
    return option.value;
  }

  /*
   * Özel yardımcı metotlar
   */

  private readRouteParameters(): void {
    const teamId = Number(
      this.route.snapshot.paramMap.get(
        'teamId'
      )
    );

    const taskId = Number(
      this.route.snapshot.paramMap.get(
        'taskId'
      )
    );

    if (
      Number.isNaN(teamId) ||
      teamId <= 0
    ) {
      this.errorMessage =
        'Geçersiz takım kimliği.';

      return;
    }

    if (
      Number.isNaN(taskId) ||
      taskId <= 0
    ) {
      this.errorMessage =
        'Geçersiz görev kimliği.';

      return;
    }

    this.teamId = teamId;

    this.taskId = taskId;

    this.loadTask();

    this.loadComments();
  }

  private getNumericStatus(
    status: string | number
  ): number {
    if (
      typeof status === 'number'
    ) {
      return status;
    }

    const numericStatus =
      Number(status);

    if (
      Number.isFinite(numericStatus)
    ) {
      return numericStatus;
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
      Record<string, number> = {
        pending: 0,
        todo: 0,
        yapılacak: 0,
        yapilacak: 0,

        inprogress: 1,
        devamediyor: 1,

        completed: 2,
        done: 2,
        tamamlandı: 2,
        tamamlandi: 2
      };

    return (
      statusMap[
        normalizedStatus
      ] ?? 0
    );
  }

  private mapPriority(
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
        priorityMap[
          priority
        ] ?? 'medium'
      );
    }

    const numericPriority =
      Number(priority);

    if (
      Number.isFinite(
        numericPriority
      )
    ) {
      const priorityMap:
        Record<number, TaskPriority> = {
          0: 'low',
          1: 'medium',
          2: 'high'
        };

      return (
        priorityMap[
          numericPriority
        ] ?? 'medium'
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
      ] ?? 'medium'
    );
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

  private getApiErrorMessage(
    error: HttpErrorResponse,
    fallbackMessage: string
  ): string {
    if (error.status === 0) {
      return 'Backend sunucusuna ulaşılamadı.';
    }

    if (error.status === 401) {
      return 'Oturumunuz sona ermiş olabilir. Lütfen tekrar giriş yapın.';
    }

    if (error.status === 403) {
      return 'Bu işlem için yetkiniz bulunmuyor.';
    }

    if (error.status === 404) {
      return this.extractBackendError(
        error,
        'İstenen kayıt bulunamadı.'
      );
    }

    return this.extractBackendError(
      error,
      fallbackMessage
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
          typeof value ===
            'string'
        ) {
          messages.push(value);

          return;
        }

        if (
          Array.isArray(value)
        ) {
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

      if (
        messages.length > 0
      ) {
        return messages.join(' ');
      }
    }

    return fallbackMessage;
  }
}