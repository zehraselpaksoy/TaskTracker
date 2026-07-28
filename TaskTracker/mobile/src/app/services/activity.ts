import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Activity } from '../models/activity';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ActivityService {

  private readonly http = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/activities`;

  getTeamActivities(
    teamId: number
  ): Observable<Activity[]> {

    return this.http.get<Activity[]>(
      `${this.apiUrl}/team/${teamId}`
    );
  }
}