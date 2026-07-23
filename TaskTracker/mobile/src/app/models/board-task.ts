export type BoardTab =
  | 'summary'
  | 'board'
  | 'list'
  | 'calendar';

export type TaskStatus =
  | 'todo'
  | 'inProgress'
  | 'done';

export type TaskPriority =
  | 'low'
  | 'medium'
  | 'high';

export interface BoardTask {
  id: number;
  key: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;

  assignedToUserId: number | null;
  assigneeName: string;
  assigneeInitials: string;

  // Görevi atayan (oluşturan) kişi alanları
  createdByName?: string;
  createdInitials?: string;
}

export interface BoardColumn {
  id: TaskStatus;
  title: string;
}

export interface BoardTaskResponse {
  id: number;
  title: string;
  description: string | null;

  priority: string | number;
  status: string | number;

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