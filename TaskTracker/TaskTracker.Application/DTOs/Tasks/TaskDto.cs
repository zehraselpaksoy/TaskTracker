using TaskTracker.Domain.Enums;

namespace TaskTracker.Application.DTOs.Tasks
{
    public class TaskDto
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public TaskPriority Priority { get; set; }

        public TaskItemStatus Status { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? DueDate { get; set; }

        public DateTime? CompletedDate { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public int CategoryId { get; set; }

        public string CategoryName { get; set; } = string.Empty;

        public int CreatedByUserId { get; set; }

        public string CreatedByName { get; set; } = string.Empty;

        public int? AssignedToUserId { get; set; }
        public string? AssignedToName { get; set; }
        public int TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
    }
}