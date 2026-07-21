import { inject, Injectable } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel
} from '@microsoft/signalr';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {

  private readonly authService = inject(AuthService);

  private hubConnection?: HubConnection;

  private readonly hubUrl =
    'https://localhost:7164/hubs/task';

  constructor() { }

  async startConnection(): Promise<void> {

    if (
      this.hubConnection &&
      this.hubConnection.state === HubConnectionState.Connected
    ) {
      return;
    }

    const token = this.authService.getToken();

    if (!token) {
      console.warn('JWT token bulunamadı.');
      return;
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    this.hubConnection.onreconnecting(() => {
      console.log('SignalR yeniden bağlanıyor...');
    });

    this.hubConnection.onreconnected(() => {
      console.log('SignalR yeniden bağlandı.');
    });

    this.hubConnection.onclose(() => {
      console.log('SignalR bağlantısı kapandı.');
    });

    await this.hubConnection.start();

    console.log('SignalR bağlantısı kuruldu.');
  }

  async stopConnection(): Promise<void> {

    if (!this.hubConnection) {
      return;
    }

    await this.hubConnection.stop();

    console.log('SignalR bağlantısı kapatıldı.');
  }

  async joinTeam(teamId: number): Promise<void> {

    if (!this.hubConnection) {
      return;
    }

    await this.hubConnection.invoke(
      'JoinTeamGroup',
      teamId
    );
  }

  async leaveTeam(teamId: number): Promise<void> {

    if (!this.hubConnection) {
      return;
    }

    await this.hubConnection.invoke(
      'LeaveTeamGroup',
      teamId
    );
  }

  onTaskStatusUpdated(
    callback: (data: any) => void
  ): void {

    if (!this.hubConnection) {
      return;
    }

    this.hubConnection.on(
      'TaskStatusUpdated',
      callback
    );
  }

  removeTaskStatusUpdated(): void {

    this.hubConnection?.off(
      'TaskStatusUpdated'
    );
  }

  isConnected(): boolean {

    return this.hubConnection?.state ===
      HubConnectionState.Connected;
  }
}