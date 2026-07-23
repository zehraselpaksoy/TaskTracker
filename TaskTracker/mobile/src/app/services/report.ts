import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'https://localhost:7164/api/reports';

  getTeamSummary(
    teamId: number
  ): Observable<TeamSummary> {
    return this.http.get<TeamSummary>(
      `${this.apiUrl}/teams/${teamId}/summary`
    );
  }
  
  getUpcomingDeadlines() {
  return this.http.get<UpcomingTask[]>(
    `${this.apiUrl}/upcoming-deadlines`
  );
}

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(
      `${this.apiUrl}/dashboard-summary`
    );
  }

  getWeeklyProgress() {
  return this.http.get<WeeklyProgress[]>(
    `${this.apiUrl}/weekly-progress`
  );
  }
}