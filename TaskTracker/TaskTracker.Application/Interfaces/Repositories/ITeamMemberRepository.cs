using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskTracker.Domain.Entities;

namespace TaskTracker.Application.Interfaces.Repositories
{
    public interface ITeamMemberRepository : IRepository<TeamMember>
    {
        Task<bool> IsTeamMemberAsync(int teamId, int userId);

        Task<bool> IsTeamLeaderAsync(int teamId, int userId);
        Task<TeamMember?> GetTeamMemberAsync(int teamId,int userId);
        Task<List<Team>> GetTeamsByUserIdAsync(int userId);
    }
}