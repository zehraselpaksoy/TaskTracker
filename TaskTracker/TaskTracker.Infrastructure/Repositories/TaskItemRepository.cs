using Microsoft.EntityFrameworkCore;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Domain.Entities;
using TaskTracker.Infrastructure.Context;

namespace TaskTracker.Infrastructure.Repositories
{
    public class TaskItemRepository : Repository<TaskItem>, ITaskItemRepository
    {
        public TaskItemRepository(TaskTrackerDbContext context)
            : base(context)
        {
        }

        public async Task<List<TaskItem>> GetCreatedTasksByUserIdAsync(int userId)
        {
            return await _context.TaskItems
                .Include(t => t.Category)
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedToUser)
                .Include(t => t.Team)
                .Where(t => t.CreatedByUserId == userId)
                .ToListAsync();
        }

        public async Task<List<TaskItem>> GetAssignedTasksByUserIdAsync(int userId)
        {
            return await _context.TaskItems
                .Include(t => t.Category)
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedToUser)
                .Include(t => t.Team)
                .Where(t => t.AssignedToUserId == userId)
                .ToListAsync();
        }

        public async Task<TaskItem?> GetByIdWithDetailsAsync(int taskId)
        {
            return await _context.TaskItems
                .Include(t => t.Category)
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedToUser)
                .Include(t => t.Team)
                .FirstOrDefaultAsync(t => t.Id == taskId);
        }
        public async Task<List<TaskItem>> GetTasksByTeamIdAsync(int teamId)
        {
            return await _context.TaskItems
                .Include(t => t.Category)
                .Include(t => t.CreatedByUser)
                .Include(t => t.AssignedToUser)
                .Include(t => t.Team)
                .Where(t => t.TeamId == teamId)
                .OrderBy(t => t.Status)
                .ThenBy(t => t.DueDate)
                .ToListAsync();
        }
    }
}