using Microsoft.EntityFrameworkCore;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Domain.Entities;
using TaskTracker.Infrastructure.Context;

namespace TaskTracker.Infrastructure.Repositories
{
    public class TaskCommentRepository
        : Repository<TaskComment>, ITaskCommentRepository
    {
        public TaskCommentRepository(TaskTrackerDbContext context)
            : base(context)
        {
        }

        public async Task<List<TaskComment>> GetCommentsByTaskIdAsync(
            int taskId)
        {
            return await _context.TaskComments
                .AsNoTracking()
                .Include(comment => comment.User)
                .Include(comment => comment.Attachments)
                .Where(comment => comment.TaskItemId == taskId)
                .OrderBy(comment => comment.CreatedAt)
                .ToListAsync();
        }

        public async Task<TaskComment?> GetByIdWithDetailsAsync(
            int commentId)
        {
            return await _context.TaskComments
                .Include(comment => comment.User)
                .Include(comment => comment.Attachments)
                .Include(comment => comment.TaskItem)
                .FirstOrDefaultAsync(comment => comment.Id == commentId);
        }
    }
}