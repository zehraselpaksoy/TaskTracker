import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface SendTeamInvitationRequest {
  email: string;
}

export interface RespondTeamInvitationRequest {
  token: string;
  accept: boolean;
}

export interface TeamInvitation {
  id: number;
  teamId: number;
  teamName: string;
  email: string;
  status: number;
  expiresAtUtc: string;
  createdAt: string;
}

export interface ApiMessageResponse {
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeamInvitationService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = environment.apiUrl;

  sendInvitation(
    teamId: number,
    request: SendTeamInvitationRequest
  ): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(
      `${this.apiUrl}/teams/${teamId}/invitations`,
      request
    );
  }

  getMyPendingInvitations(): Observable<TeamInvitation[]> {
    return this.http.get<TeamInvitation[]>(
      `${this.apiUrl}/invitations/my`
    );
  }

  respondInvitation(
    request: RespondTeamInvitationRequest
  ): Observable<ApiMessageResponse> {
    return this.http.post<ApiMessageResponse>(
      `${this.apiUrl}/invitations/respond`,
      request
    );
  }
}