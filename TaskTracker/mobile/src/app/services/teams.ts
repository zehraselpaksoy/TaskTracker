import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BoardTaskResponse } from '../models/board-task';
import { Team, TeamDetail } from '../models/team';

@Injectable({
  providedIn: 'root'
})
export class TeamService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = 'https://localhost:7164/api/teams';
  private readonly taskApiUrl = 'https://localhost:7164/api/tasks'; // <-- Eklendi

  /**
   * Kullanıcının üye olduğu tüm takımları getirir.
   */
  getMyTeams(): Observable<Team[]> {
    return this.http.get<Team[]>(`${this.apiBaseUrl}/my`);
  }

  /**
   * Belirtilen takımın detaylarını, üyelerini ve diğer bilgilerini getirir.
   */
  getTeamById(teamId: number): Observable<TeamDetail> {
    return this.http.get<TeamDetail>(`${this.apiBaseUrl}/${teamId}`);
  }

  /**
   * Belirtilen takıma ait panodaki/listedeki görevleri getirir.
   */
  getTeamTasks(teamId: number): Observable<BoardTaskResponse[]> {
    // Backend'deki TaskController [HttpGet("team/{teamId}")] adresine istek atıyoruz:
    return this.http.get<BoardTaskResponse[]>(`${this.taskApiUrl}/team/${teamId}`);
  }
}