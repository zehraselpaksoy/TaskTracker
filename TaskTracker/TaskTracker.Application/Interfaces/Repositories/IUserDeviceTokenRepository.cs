using TaskTracker.Domain.Entities;

namespace TaskTracker.Application.Interfaces.Repositories;

public interface IUserDeviceTokenRepository
    : IRepository<UserDeviceToken>
{
    Task<UserDeviceToken?> GetByTokenAsync(string token);

    Task<List<UserDeviceToken>> GetByUserIdAsync(int userId);
}