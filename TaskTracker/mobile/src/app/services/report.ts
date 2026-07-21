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

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    'https://localhost:7164/api/reports';

  getTeamSummary(
    teamId: number
  ): Observable<TeamSummary> {
    return this.http.get<TeamSummary>(
      `${this.apiUrl}/teams/${teamId}/summary`
    );
  }
}