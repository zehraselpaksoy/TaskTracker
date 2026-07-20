using Microsoft.EntityFrameworkCore;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Domain.Entities;
using TaskTracker.Domain.Enums;
using TaskTracker.Infrastructure.Context;

namespace TaskTracker.Infrastructure.Repositories
{
    public class TeamMemberRepository
        : Repository<TeamMember>, ITeamMemberRepository
    {
        public TeamMemberRepository(TaskTrackerDbContext context)
            : base(context)
        {
        }

        public async Task<bool> IsTeamMemberAsync(
            int teamId,
            int userId)
        {
            return await _context.TeamMembers
                .AnyAsync(tm =>
                    tm.TeamId == teamId &&
                    tm.UserId == userId);
        }

        public async Task<bool> IsTeamLeaderAsync(
            int teamId,
            int userId)
        {
            return await _context.TeamMembers
                .AnyAsync(tm =>
                    tm.TeamId == teamId &&
                    tm.UserId == userId &&
                    tm.Role == TeamRole.Leader);
        }
        public async Task<TeamMember?> GetTeamMemberAsync(
            int teamId,
            int userId)
        {
            return await _context.TeamMembers
                .FirstOrDefaultAsync(tm =>
                    tm.TeamId == teamId &&
                    tm.UserId == userId);
        }
        public async Task<List<Team>> GetTeamsByUserIdAsync(int userId)
        {
            return await _context.TeamMembers
                .Where(teamMember => teamMember.UserId == userId)
                .Include(teamMember => teamMember.Team)
                    .ThenInclude(team => team.Members)
                        .ThenInclude(member => member.User)
                .Select(teamMember => teamMember.Team)
                .ToListAsync();
        }

    }
}