using TaskTracker.Domain.Enums;

namespace TaskTracker.Application.DTOs.Tasks
{
    public class UpdateTaskStatusDto
    {
        public TaskItemStatus Status { get; set; }
    }
}