using TaskTracker.Application.DTOs.Tasks;

namespace TaskTracker.Application.Interfaces.Services
{
    public interface ITaskService
    {
        Task CreateTaskAsync(CreateTaskDto createTaskDto, int createdByUserId);

        Task UpdateTaskAsync(
            int taskId,
            UpdateTaskDto updateTaskDto,
            int currentUserId);
        Task<int> UpdateTaskStatusAsync(int taskId,UpdateTaskStatusDto updateTaskStatusDto,int currentUserId);
        Task DeleteTaskAsync(int taskId, int currentUserId);

        Task<TaskDto?> GetTaskByIdAsync(int taskId, int currentUserId);

        Task<List<TaskDto>> GetCreatedTasksAsync(int userId);

        Task<List<TaskDto>> GetAssignedTasksAsync(int userId);
        Task<List<TaskDto>> GetMyTasksAsync(int currentUserId);
        Task<List<TaskDto>> GetTeamTasksAsync(int teamId,int currentUserId);


    }
}