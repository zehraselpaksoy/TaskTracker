using TaskTracker.Application.DTOs.Tasks;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Application.Interfaces.Services;
using TaskTracker.Domain.Entities;
using TaskTracker.Domain.Enums;

namespace TaskTracker.Application.Services
{
    public class TaskService : ITaskService
    {
        private readonly IUnitOfWork _unitOfWork;

        public TaskService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task CreateTaskAsync(
            CreateTaskDto createTaskDto,    
            int createdByUserId)
        {
            var category = await _unitOfWork.Categories
                .GetByIdAsync(createTaskDto.CategoryId);

            if (category == null)
            {
                throw new Exception("Kategori bulunamadı.");
            }

            var team = await _unitOfWork.Teams
                .GetByIdAsync(createTaskDto.TeamId);

            if (team == null)
            {
                throw new Exception("Takım bulunamadı.");
            }

            var isLeader = await _unitOfWork.TeamMembers
                .IsTeamLeaderAsync(
                    createTaskDto.TeamId,
                    createdByUserId);

            if (!isLeader)
            {
                throw new UnauthorizedAccessException(
                    "Bu takımda görev oluşturmak için lider olmalısınız.");
            }

            if (createTaskDto.AssignedToUserId.HasValue)
            {
                var assignedUser = await _unitOfWork.Users
                    .GetByIdAsync(createTaskDto.AssignedToUserId.Value);

                if (assignedUser == null)
                {
                    throw new Exception("Atanan kullanıcı bulunamadı.");
                }

                var isAssignedUserTeamMember =
                    await _unitOfWork.TeamMembers.IsTeamMemberAsync(
                        createTaskDto.TeamId,
                        createTaskDto.AssignedToUserId.Value);

                if (!isAssignedUserTeamMember)
                {
                    throw new Exception(
                        "Görev yalnızca takım üyelerinden birine atanabilir.");
                }
            }

            var taskItem = new TaskItem
            {
                Title = createTaskDto.Title,
                Description = createTaskDto.Description,
                DueDate = createTaskDto.DueDate,
                Priority = createTaskDto.Priority,

                CategoryId = createTaskDto.CategoryId,
                TeamId = createTaskDto.TeamId,

                CreatedByUserId = createdByUserId,
                AssignedToUserId = createTaskDto.AssignedToUserId,

                Status = TaskItemStatus.Pending,
                StartDate = null,
                CompletedDate = null
            };

            _unitOfWork.Tasks.Add(taskItem);

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task UpdateTaskAsync(
            int taskId,
            UpdateTaskDto updateTaskDto,
            int currentUserId)
        {
            var task = await _unitOfWork.Tasks
                .GetByIdWithDetailsAsync(taskId);

            if (task == null)
            {
                throw new Exception("Görev bulunamadı.");
            }

            var isLeader = await _unitOfWork.TeamMembers
                .IsTeamLeaderAsync(task.TeamId, currentUserId);

            if (!isLeader)
            {
                throw new UnauthorizedAccessException(
                    "Görevin tüm alanlarını yalnızca takım lideri güncelleyebilir.");
            }

            var category = await _unitOfWork.Categories
                .GetByIdAsync(updateTaskDto.CategoryId);

            if (category == null)
            {
                throw new Exception("Kategori bulunamadı.");
            }

            if (updateTaskDto.AssignedToUserId.HasValue)
            {
                var assignedUser = await _unitOfWork.Users
                    .GetByIdAsync(updateTaskDto.AssignedToUserId.Value);

                if (assignedUser == null)
                {
                    throw new Exception("Atanan kullanıcı bulunamadı.");
                }

                var isAssignedUserTeamMember =
                    await _unitOfWork.TeamMembers.IsTeamMemberAsync(
                        task.TeamId,
                        updateTaskDto.AssignedToUserId.Value);

                if (!isAssignedUserTeamMember)
                {
                    throw new Exception(
                        "Görev yalnızca aynı takımın bir üyesine atanabilir.");
                }
            }

            task.Title = updateTaskDto.Title;
            task.Description = updateTaskDto.Description;
            task.Priority = updateTaskDto.Priority;
            task.CategoryId = updateTaskDto.CategoryId;
            task.AssignedToUserId = updateTaskDto.AssignedToUserId;
            task.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Tasks.Update(task);

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<int> UpdateTaskStatusAsync(
    int taskId,
    UpdateTaskStatusDto updateTaskStatusDto,
    int currentUserId)
        {
            var task = await _unitOfWork.Tasks
                .GetByIdWithDetailsAsync(taskId);

            if (task == null)
            {
                throw new Exception("Görev bulunamadı.");
            }

            var isLeader = await _unitOfWork.TeamMembers
                .IsTeamLeaderAsync(task.TeamId, currentUserId);

            var isAssignedUser =
                task.AssignedToUserId == currentUserId;

            if (!isLeader && !isAssignedUser)
            {
                throw new UnauthorizedAccessException(
                    "Bu görevin durumunu değiştirme yetkiniz yok.");
            }

            UpdateTaskDates(
                task,
                updateTaskStatusDto.Status);

            task.Status = updateTaskStatusDto.Status;
            task.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Tasks.Update(task);

            await _unitOfWork.SaveChangesAsync();

            return task.TeamId;
        }
        public async Task DeleteTaskAsync(
            int taskId,
            int currentUserId)
        {
            var task = await _unitOfWork.Tasks
                .GetByIdWithDetailsAsync(taskId);

            if (task == null)
            {
                throw new Exception("Görev bulunamadı.");
            }

            var isLeader = await _unitOfWork.TeamMembers
                .IsTeamLeaderAsync(task.TeamId, currentUserId);

            if (!isLeader)
            {
                throw new UnauthorizedAccessException(
                    "Bu görevi yalnızca takım lideri silebilir.");
            }

            _unitOfWork.Tasks.Delete(task);

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<TaskDto?> GetTaskByIdAsync(
            int taskId,
            int currentUserId)
        {
            var task = await _unitOfWork.Tasks
                .GetByIdWithDetailsAsync(taskId);

            if (task == null)
            {
                return null;
            }

            var isTeamMember = await _unitOfWork.TeamMembers
                .IsTeamMemberAsync(task.TeamId, currentUserId);

            if (!isTeamMember)
            {
                throw new UnauthorizedAccessException(
                    "Bu görevi görüntüleme yetkiniz yok.");
            }

            return MapToDto(task);
        }

        public async Task<List<TaskDto>> GetMyTasksAsync(int userId)
        {
            var createdTasks = await _unitOfWork.Tasks
                .GetCreatedTasksByUserIdAsync(userId);

            var assignedTasks = await _unitOfWork.Tasks
                .GetAssignedTasksByUserIdAsync(userId);

            var tasks = createdTasks
                .Concat(assignedTasks)
                .GroupBy(task => task.Id)
                .Select(group => group.First())
                .OrderByDescending(task => task.UpdatedAt ?? task.CreatedAt)
                .Select(MapToDto)
                .ToList();

            return tasks;
        }
        public async Task<List<TaskDto>> GetCreatedTasksAsync(int userId)
        {
            var tasks = await _unitOfWork.Tasks
                .GetCreatedTasksByUserIdAsync(userId);

            return tasks
                .Select(MapToDto)
                .ToList();
        }

        public async Task<List<TaskDto>> GetAssignedTasksAsync(int userId)
        {
            var tasks = await _unitOfWork.Tasks
                .GetAssignedTasksByUserIdAsync(userId);

            return tasks
                .Select(MapToDto)
                .ToList();
        }
        public async Task<List<TaskDto>> GetTeamTasksAsync(int teamId,int currentUserId)
        {
            var team = await _unitOfWork.Teams
                .GetByIdAsync(teamId);

            if (team == null)
            {
                throw new Exception("Takım bulunamadı.");
            }

            var isTeamMember = await _unitOfWork.TeamMembers
                .IsTeamMemberAsync(teamId, currentUserId);

            if (!isTeamMember)
            {
                throw new UnauthorizedAccessException(
                    "Bu takımın görevlerini görüntüleme yetkiniz yok.");
            }

            var tasks = await _unitOfWork.Tasks
                .GetTasksByTeamIdAsync(teamId);

            return tasks
                .Select(MapToDto)
                .ToList();
        }

        private static void UpdateTaskDates(
            TaskItem task,
            TaskItemStatus newStatus)
        {
            var oldStatus = task.Status;

            if (oldStatus == TaskItemStatus.Pending &&
                newStatus == TaskItemStatus.InProgress &&
                task.StartDate == null)
            {
                task.StartDate = DateTime.UtcNow;
            }

            if (newStatus == TaskItemStatus.Completed)
            {
                if (task.StartDate == null)
                {
                    task.StartDate = DateTime.UtcNow;
                }

                if (oldStatus != TaskItemStatus.Completed)
                {
                    task.CompletedDate = DateTime.UtcNow;
                }
            }
            else if (oldStatus == TaskItemStatus.Completed)
            {
                task.CompletedDate = null;
            }
        }

        private static TaskDto MapToDto(TaskItem task)
        {
            return new TaskDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                Priority = task.Priority,
                Status = task.Status,

                StartDate = task.StartDate,
                DueDate = task.DueDate,
                CompletedDate = task.CompletedDate,

                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt,

                CategoryId = task.CategoryId,
                CategoryName = task.Category.Name,

                TeamId = task.TeamId,
                TeamName = task.Team.Name,

                CreatedByUserId = task.CreatedByUserId,
                CreatedByName =
                    $"{task.CreatedByUser.FirstName} {task.CreatedByUser.LastName}",

                AssignedToUserId = task.AssignedToUserId,
                AssignedToName = task.AssignedToUser == null
                    ? null
                    : $"{task.AssignedToUser.FirstName} {task.AssignedToUser.LastName}"
            };
        }
    }
}