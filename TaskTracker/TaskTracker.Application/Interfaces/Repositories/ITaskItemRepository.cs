using TaskTracker.Domain.Entities;

namespace TaskTracker.Application.Interfaces.Repositories
{
    public interface ITaskItemRepository : IRepository<TaskItem>
    {
        Task<List<TaskItem>> GetCreatedTasksByUserIdAsync(int userId);

        Task<List<TaskItem>> GetAssignedTasksByUserIdAsync(int userId);

        Task<TaskItem?> GetByIdWithDetailsAsync(int taskId);
        Task<List<TaskItem>> GetTasksByTeamIdAsync(int teamId);
        Task<List<TaskItem>> GetTasksByUserTeamMembershipsAsync(int userId );
    }
}