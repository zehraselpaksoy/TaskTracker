namespace TaskTracker.NotificationService.Services;

public interface IFirebaseNotificationService
{
    Task<string> SendAsync(
        string deviceToken,
        string title,
        string body,
        IReadOnlyDictionary<string, string>? data = null,
        CancellationToken cancellationToken = default);
}