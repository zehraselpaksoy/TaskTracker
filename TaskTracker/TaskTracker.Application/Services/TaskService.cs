using TaskTracker.Application.DTOs.Tasks;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Application.Interfaces.Services;
using TaskTracker.Domain.Entities;
using TaskTracker.Domain.Enums;
using TaskTracker.Application.Interfaces.Messaging;
using TaskTracker.Contracts.Events;

namespace TaskTracker.Application.Services
{
    public class TaskService : ITaskService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityService _activityService;
        private readonly IRabbitMqPublisher _rabbitMqPublisher;
        public TaskService(IUnitOfWork unitOfWork, IActivityService activityService, IRabbitMqPublisher rabbitMqPublisher)
        {
            _unitOfWork = unitOfWork;
            _activityService = activityService;
            _rabbitMqPublisher = rabbitMqPublisher;
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

            await _activityService.LogAsync(
                teamId: taskItem.TeamId,
                userId: createdByUserId,
                taskId: taskItem.Id,
                type: ActivityType.TaskCreated,
                description: $"\"{taskItem.Title}\" görevi oluşturuldu."
            );
            if (taskItem.AssignedToUserId.HasValue)
            {
                var createdByUser = await _unitOfWork.Users
                    .GetByIdAsync(createdByUserId);

                var assignedByUserName = createdByUser is null
                    ? "Takım lideri"
                    : $"{createdByUser.FirstName} {createdByUser.LastName}".Trim();

                var taskAssignedEvent = new TaskAssignedEvent
                {
                    TaskId = taskItem.Id,
                    AssignedUserId = taskItem.AssignedToUserId.Value,
                    TaskTitle = taskItem.Title,
                    AssignedByUserName = assignedByUserName
                };

                await _rabbitMqPublisher.PublishAsync(
                    queueName: "task-assigned-queue",
                    message: taskAssignedEvent);
            }
        }

        public async Task UpdateTaskAsync(int taskId,UpdateTaskDto updateTaskDto,int currentUserId)
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
            var previousAssignedUserId = task.AssignedToUserId;
            var previousTitle = task.Title;
            task.Title = updateTaskDto.Title;
            task.Description = updateTaskDto.Description;
            task.Priority = updateTaskDto.Priority;
            task.CategoryId = updateTaskDto.CategoryId;
            task.AssignedToUserId = updateTaskDto.AssignedToUserId;
            task.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.Tasks.Update(task);

            await _unitOfWork.SaveChangesAsync();

            var assignmentChanged =
                previousAssignedUserId != task.AssignedToUserId;

            if (assignmentChanged)
            {
                var assignmentDescription =
                    task.AssignedToUserId.HasValue
                        ? $"\"{task.Title}\" görevinin atanan kişisi değiştirildi."
                        : $"\"{task.Title}\" görevinin kullanıcı ataması kaldırıldı.";

                await _activityService.LogAsync(
                    teamId: task.TeamId,
                    userId: currentUserId,
                    taskId: task.Id,
                    type: ActivityType.TaskAssigned,
                    description: assignmentDescription
                );

                // Yeni bir kullanıcıya atandıysa bildirim mesajı gönder.
                if (task.AssignedToUserId.HasValue)
                {
                    var assignedByUser = await _unitOfWork.Users
                        .GetByIdAsync(currentUserId);

                    var assignedByUserName = assignedByUser is null
                        ? "Takım lideri"
                        : $"{assignedByUser.FirstName} {assignedByUser.LastName}".Trim();

                    var taskAssignedEvent = new TaskAssignedEvent
                    {
                        TaskId = task.Id,
                        AssignedUserId = task.AssignedToUserId.Value,
                        TaskTitle = task.Title,
                        AssignedByUserName = assignedByUserName
                    };

                    await _rabbitMqPublisher.PublishAsync(
                        queueName: "task-assigned-queue",
                        message: taskAssignedEvent);
                }
            }
            else
            {
                await _activityService.LogAsync(
                    teamId: task.TeamId,
                    userId: currentUserId,
                    taskId: task.Id,
                    type: ActivityType.TaskUpdated,
                    description: $"\"{task.Title}\" görevi güncellendi."
                );
            }
        }

        public async Task<int> UpdateTaskStatusAsync(int taskId, UpdateTaskStatusDto updateTaskStatusDto,int currentUserId)
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

            var previousStatus = task.Status;

            UpdateTaskDates(
                task,
                updateTaskStatusDto.Status);

            task.Status = updateTaskStatusDto.Status;
            task.UpdatedAt = DateTime.UtcNow;

            await _unitOfWork.SaveChangesAsync();

            if (previousStatus != task.Status)
            {
                await _activityService.LogAsync(
                    teamId: task.TeamId,
                    userId: currentUserId,
                    taskId: task.Id,
                    type: ActivityType.TaskStatusChanged,
                    description:
                        $"\"{task.Title}\" görevi " +
                        $"\"{GetStatusLabel(previousStatus)}\" durumundan " +
                        $"\"{GetStatusLabel(task.Status)}\" durumuna taşındı."
                );
                var recipientUserIds = new HashSet<int>();

                // Görevi oluşturan kişi, durumu değiştiren kişi değilse bildir.
                if (task.CreatedByUserId != currentUserId)
                {
                    recipientUserIds.Add(task.CreatedByUserId);
                }

                // Atanan kullanıcı varsa ve durumu değiştiren kişi değilse bildir.
                if (task.AssignedToUserId.HasValue &&
                    task.AssignedToUserId.Value != currentUserId)
                {
                    recipientUserIds.Add(task.AssignedToUserId.Value);
                }

                if (recipientUserIds.Count > 0)
                {
                    var changedByUser = await _unitOfWork.Users
                        .GetByIdAsync(currentUserId);

                    var changedByUserName = changedByUser is null
                        ? "Bir takım üyesi"
                        : $"{changedByUser.FirstName} {changedByUser.LastName}".Trim();

                    var statusChangedEvent = new TaskStatusChangedEvent
                    {
                        TaskId = task.Id,
                        TaskTitle = task.Title,
                        PreviousStatus = GetStatusLabel(previousStatus),
                        NewStatus = GetStatusLabel(task.Status),
                        ChangedByUserId = currentUserId,
                        ChangedByUserName = changedByUserName,
                        RecipientUserIds = recipientUserIds.ToList()
                    };

                    await _rabbitMqPublisher.PublishAsync(
                        queueName: "task-status-changed-queue",
                        message: statusChangedEvent);
                }
            }

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

            var deletedTaskTitle = task.Title;
            var teamId = task.TeamId;

            _unitOfWork.Tasks.Delete(task);

            await _unitOfWork.SaveChangesAsync();

            await _activityService.LogAsync(
                teamId: teamId,
                userId: currentUserId,
                taskId: null,
                type: ActivityType.TaskDeleted,
                description: $"\"{deletedTaskTitle}\" görevi silindi."
            );
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
        private static string GetStatusLabel(TaskItemStatus status)
        {
            return status switch
            {
                TaskItemStatus.Pending => "Yapılacak",
                TaskItemStatus.InProgress => "Devam Ediyor",
                TaskItemStatus.Completed => "Tamamlandı",
                _ => status.ToString()
            };
        }
    }
}