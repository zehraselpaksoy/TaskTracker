namespace TaskTracker.NotificationService.Services;

public interface IDeviceTokenProvider
{
    Task<List<string>> GetTokensAsync(
        IEnumerable<int> userIds,
        CancellationToken cancellationToken = default);
}