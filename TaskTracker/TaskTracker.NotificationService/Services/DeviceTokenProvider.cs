using Microsoft.EntityFrameworkCore;
using TaskTracker.Infrastructure.Context;

namespace TaskTracker.NotificationService.Services;

public sealed class DeviceTokenProvider : IDeviceTokenProvider
{
    private readonly IDbContextFactory<TaskTrackerDbContext>
        _dbContextFactory;

    public DeviceTokenProvider(
        IDbContextFactory<TaskTrackerDbContext> dbContextFactory)
    {
        _dbContextFactory = dbContextFactory;
    }

    public async Task<List<string>> GetTokensAsync(
        IEnumerable<int> userIds,
        CancellationToken cancellationToken = default)
    {
        var distinctUserIds = userIds
            .Distinct()
            .ToList();

        if (distinctUserIds.Count == 0)
        {
            return [];
        }

        await using var context =
            await _dbContextFactory.CreateDbContextAsync(
                cancellationToken);

        return await context.UserDeviceTokens
            .AsNoTracking()
            .Where(deviceToken =>
                distinctUserIds.Contains(deviceToken.UserId))
            .Select(deviceToken => deviceToken.Token)
            .Distinct()
            .ToListAsync(cancellationToken);
    }
}