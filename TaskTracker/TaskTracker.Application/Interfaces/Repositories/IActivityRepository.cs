using TaskTracker.Domain.Entities;

namespace TaskTracker.Application.Interfaces.Repositories;

public interface IActivityRepository
{
    Task AddAsync(Activity activity);

    Task<List<Activity>> GetByTeamIdAsync(
        int teamId,
        int take = 50
    );
}