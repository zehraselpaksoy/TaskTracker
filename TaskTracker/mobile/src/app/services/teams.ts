import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { BoardTaskResponse } from '../models/board-task';
import { Team, TeamDetail } from '../models/team';
import { environment } from '../../environments/environment';

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
    `${environment.apiUrl}/teams`;

  private readonly taskApiUrl =
    `${environment.apiUrl}/tasks`;

  private readonly userApiUrl =
    `${environment.apiUrl}/users`;

  searchUsers(
    query: string,
    teamId: number
  ): Observable<UserSearchResult[]> {
    return this.http.get<UserSearchResult[]>(
      `${this.userApiUrl}/search`,
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