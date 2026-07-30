using FirebaseAdmin.Messaging;

namespace TaskTracker.NotificationService.Services;

public sealed class FirebaseNotificationService
    : IFirebaseNotificationService
{
    public async Task<string> SendAsync(
        string deviceToken,
        string title,
        string body,
        IReadOnlyDictionary<string, string>? data = null,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(deviceToken))
        {
            throw new ArgumentException(
                "Cihaz tokenı boş olamaz.",
                nameof(deviceToken));
        }
        var message = new Message
        {
            Notification = new Notification
            {
                Title = title,
                Body = body
            },

            Android = new AndroidConfig
            {
                Priority = Priority.High,
                TimeToLive = TimeSpan.FromHours(1),

                Notification = new AndroidNotification
                {
                    Priority = NotificationPriority.HIGH,
                    DefaultSound = true,
                    DefaultVibrateTimings = true
                }
            },

            Data = data is null
        ? null
        : new Dictionary<string, string>(data)
        };

#pragma warning disable CS0618
        message.Token = deviceToken;
#pragma warning restore CS0618

        return await FirebaseMessaging.DefaultInstance.SendAsync(
            message,
            cancellationToken);
    }
}