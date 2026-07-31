import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TeamSummary {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface DashboardSummary {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  myTasks: number;

  overdueTaskItems: OverdueTask[];
}

export interface WeeklyProgress {
  day: string;
  createdTasks: number;
  completedTasks: number;
}

export interface UpcomingTask {
  id: number;
  title: string;
  dueDate: string;
  teamName: string;
  priority: string;
  remainingDays: number;
}
export interface OverdueTask {
  id: number;
  teamId: number;
  title: string;
  teamName: string;
  dueDate: string;
  priority: string;
  overdueDays: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/reports`;

  getTeamSummary(
    teamId: number
  ): Observable<TeamSummary> {
    return this.http.get<TeamSummary>(
      `${this.apiUrl}/teams/${teamId}/summary`
    );
  }

  getOverdueTasks():
  Observable<OverdueTask[]> {
  return this.http.get<OverdueTask[]>(
    `${this.apiUrl}/overdue-tasks`
  );
}
  getUpcomingDeadlines(): Observable<UpcomingTask[]> {
    return this.http.get<UpcomingTask[]>(
      `${this.apiUrl}/upcoming-deadlines`
    );
  }

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(
      `${this.apiUrl}/dashboard-summary`
    );
  }

  getWeeklyProgress(): Observable<WeeklyProgress[]> {
    return this.http.get<WeeklyProgress[]>(
      `${this.apiUrl}/weekly-progress`
    );
  }
}