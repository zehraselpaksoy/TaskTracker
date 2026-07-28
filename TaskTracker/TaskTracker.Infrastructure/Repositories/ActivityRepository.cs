using Microsoft.EntityFrameworkCore;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Domain.Entities;
using TaskTracker.Infrastructure.Context;

namespace TaskTracker.Infrastructure.Repositories;

public class ActivityRepository : IActivityRepository
{
    private readonly TaskTrackerDbContext _context;

    public ActivityRepository(
        TaskTrackerDbContext context
    )
    {
        _context = context;
    }

    public async Task AddAsync(Activity activity)
    {
        await _context.Activities.AddAsync(activity);

    }

    public async Task<List<Activity>> GetByTeamIdAsync(int teamId,int take = 50)
    {
        return await _context.Activities
            .AsNoTracking()
            .Include(x => x.User)
            .Where(x => x.TeamId == teamId)
            .OrderByDescending(x => x.CreatedAt)
            .Take(take)
            .ToListAsync();
    }
}