using Microsoft.EntityFrameworkCore;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Domain.Entities;
using TaskTracker.Infrastructure.Context;

namespace TaskTracker.Infrastructure.Repositories;

public sealed class UserDeviceTokenRepository
    : Repository<UserDeviceToken>,
      IUserDeviceTokenRepository
{
    public UserDeviceTokenRepository(
        TaskTrackerDbContext context)
        : base(context)
    {
    }

    public async Task<UserDeviceToken?> GetByTokenAsync(
        string token)
    {
        return await _context.UserDeviceTokens
            .FirstOrDefaultAsync(deviceToken =>
                deviceToken.Token == token);
    }

    public async Task<List<UserDeviceToken>> GetByUserIdAsync(
        int userId)
    {
        return await _context.UserDeviceTokens
            .AsNoTracking()
            .Where(deviceToken =>
                deviceToken.UserId == userId)
            .ToListAsync();
    }
}