using TaskTracker.Domain.Entities;

namespace TaskTracker.Application.Interfaces.Repositories
{
    public interface ITeamRepository : IRepository<Team>
    {
        Task<Team?> GetByNameAsync(string name);
        Task<Team?> GetByIdWithDetailsAsync(int teamId);
        Task<List<Team>> GetAllWithDetailsAsync();
        

    }
}