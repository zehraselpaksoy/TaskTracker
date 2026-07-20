import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import {
  Team,
  TeamDetail
} from '../models/team';

import {
  BoardTaskResponse
} from '../models/board-task';

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl =
    'https://localhost:7164/api/teams';

  private readonly taskApiUrl =
    'https://localhost:7164/api/tasks';

  getMyTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(
      `${this.apiUrl}/my`
    );
  }

  getTeamById(
    teamId: number
  ): Observable<TeamDetail> {
    return this.http.get<TeamDetail>(
      `${this.apiUrl}/${teamId}`
    );
  }

  getTeamTasks(
    teamId: number
  ): Observable<BoardTaskResponse[]> {
    return this.http.get<BoardTaskResponse[]>(
      `${this.taskApiUrl}/team/${teamId}`
    );
  }
}