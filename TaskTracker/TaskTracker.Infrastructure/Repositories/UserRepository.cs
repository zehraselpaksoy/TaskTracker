using Microsoft.EntityFrameworkCore;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Domain.Entities;
using TaskTracker.Infrastructure.Context;

namespace TaskTracker.Infrastructure.Repositories
{
    public class UserRepository : Repository<User>, IUserRepository
    {
        public UserRepository(TaskTrackerDbContext context)
            : base(context)
        {
        }

        public async  Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users
                .FirstOrDefaultAsync(x => x.Email == email);
        }
        public async Task<List<User>> SearchUsersAsync(string query,int teamId)
        {
            query = query.Trim();

            return await _context.Users
                .AsNoTracking()
                .Where(user =>
                    (
                        EF.Functions.Like(user.FirstName, $"%{query}%") ||

                        EF.Functions.Like(user.LastName, $"%{query}%") ||

                        EF.Functions.Like(user.Email, $"%{query}%")
                    )
                    &&
                    !_context.TeamMembers.Any(member =>
                        member.TeamId == teamId &&
                        member.UserId == user.Id
                    )
                )
                .OrderBy(user => user.FirstName)
                .ThenBy(user => user.LastName)
                .Take(20)
                .ToListAsync();
        }
    }

}