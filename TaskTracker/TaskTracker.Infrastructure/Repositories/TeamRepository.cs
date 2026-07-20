using Microsoft.EntityFrameworkCore;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Domain.Entities;
using TaskTracker.Infrastructure.Context;

namespace TaskTracker.Infrastructure.Repositories
{
    public class TeamRepository : Repository<Team>, ITeamRepository
    {
        public TeamRepository(TaskTrackerDbContext context)
            : base(context)
        {
        }
        public async Task<Team?> GetByNameAsync(string name)
        {
            var normalizedName = name.Trim().ToLower();

            return await _context.Teams
                .FirstOrDefaultAsync(t =>
                    t.Name.ToLower() == normalizedName);
        }
        public async Task<Team?> GetByIdWithDetailsAsync(int teamId)
        {
            return await _context.Teams
                .Include(t => t.Members)
                    .ThenInclude(tm => tm.User)
                .FirstOrDefaultAsync(t => t.Id == teamId);
        }
        public async Task<List<Team>> GetAllWithDetailsAsync()
        {
            return await _context.Teams
                .Include(t => t.Members)
                    .ThenInclude(tm => tm.User)
                .ToListAsync();
        }
    }
}