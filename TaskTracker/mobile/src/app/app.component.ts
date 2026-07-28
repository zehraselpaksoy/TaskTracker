import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonApp,
  IonRouterOutlet
} from '@ionic/angular/standalone';
import {
  PushNotificationService
} from './services/push-notification.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonApp,
    IonRouterOutlet
  ]
})
export class AppComponent {
  constructor(
    private readonly pushNotificationService:
      PushNotificationService
  ) {
    void this.pushNotificationService.initialize();
  }
}