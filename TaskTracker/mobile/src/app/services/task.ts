import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface TaskResponse {
  id: number;
  title: string;
  description?: string | null;

  priority: number | string;
  status: number | string;

  startDate?: string | null;
  dueDate?: string | null;
  completedDate?: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;

  categoryId?: number;
  categoryName?: string | null;

  teamId: number;
  teamName?: string | null;

  createdByUserId?: number;
  createdByName?: string | null;

  assignedToUserId?: number | null;
  assignedToName?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {

  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    'https://localhost:7164/api/tasks';

  getMyTasks(): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(
      `${this.apiUrl}/my`
    );
  }

  getTaskById(
    taskId: number
  ): Observable<TaskResponse> {
    return this.http.get<TaskResponse>(
      `${this.apiUrl}/${taskId}`
    );
  }

  getTeamTasks(
    teamId: number
  ): Observable<TaskResponse[]> {
    return this.http.get<TaskResponse[]>(
      `${this.apiUrl}/team/${teamId}`
    );
  }
}