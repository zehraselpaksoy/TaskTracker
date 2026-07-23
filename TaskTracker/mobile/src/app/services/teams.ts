import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { BoardTaskResponse } from '../models/board-task';
import { Team, TeamDetail } from '../models/team';

export interface CreateTeamRequest {
  name: string;
  description?: string | null;
}

export interface UserSearchResult {
  id: number;
  fullName: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeamService {

  private readonly http = inject(HttpClient);

  private readonly apiBaseUrl =
    'https://localhost:7164/api/teams';

  private readonly taskApiUrl =
    'https://localhost:7164/api/tasks';

    searchUsers(
  query: string,
  teamId: number
): Observable<UserSearchResult[]> {
  return this.http.get<UserSearchResult[]>(
    'https://localhost:7164/api/users/search',
    {
      params: {
        query,
        teamId
      }
    }
  );
}

addMember(
  teamId: number,
  userId: number
): Observable<string> {
  return this.http.post(
    `${this.apiBaseUrl}/${teamId}/members/${userId}`,
    null,
    {
      responseType: 'text'
    }
  );
}
  createTeam(
    request: CreateTeamRequest
  ): Observable<Team> {
    return this.http.post<Team>(
      this.apiBaseUrl,
      request
    );
  }

  getMyTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(
      `${this.apiBaseUrl}/my`
    );
  }

  getTeamById(
    teamId: number
  ): Observable<TeamDetail> {
    return this.http.get<TeamDetail>(
      `${this.apiBaseUrl}/${teamId}`
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