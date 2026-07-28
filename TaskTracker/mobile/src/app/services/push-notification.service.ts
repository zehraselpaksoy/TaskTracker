import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token
} from '@capacitor/push-notifications';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.initialized) {
      return;
    }

    this.initialized = true;

    await PushNotifications.addListener(
      'registration',
      (token: Token) => {
        console.log('FCM token:', token.value);
      }
    );

    await PushNotifications.addListener(
      'registrationError',
      (error: unknown) => {
        console.error(
          'Push notification kayıt hatası:',
          error
        );
      }
    );

    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        console.log('Bildirim alındı:', notification);
      }
    );

   await PushNotifications.addListener(
  'registration',
  (token: Token) => {
    localStorage.setItem(
      'fcmToken',
      token.value
    );

    console.log(
      'FCM token başarıyla alındı.'
    );
  }
);

    let permissionStatus =
      await PushNotifications.checkPermissions();

    if (permissionStatus.receive === 'prompt') {
      permissionStatus =
        await PushNotifications.requestPermissions();
    }

    if (permissionStatus.receive !== 'granted') {
      console.warn('Bildirim izni verilmedi.');
      return;
    }

    await PushNotifications.register();
  }
}