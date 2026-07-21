using TaskTracker.Domain.Entities;

namespace TaskTracker.Application.Interfaces.Repositories
{
    public interface ITaskCommentRepository : IRepository<TaskComment>
    {
        Task<List<TaskComment>> GetCommentsByTaskIdAsync(int taskId);

        Task<TaskComment?> GetByIdWithDetailsAsync(int commentId);
    }
}