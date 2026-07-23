using TaskTracker.Domain.Enums;

namespace TaskTracker.Application.DTOs.Tasks
{
    public class CreateTaskDto
    {
        public required string Title { get; set; }

        public string? Description { get; set; }

        public DateTime? DueDate { get; set; }

        public TaskPriority Priority { get; set; }

        public int CategoryId { get; set; }

        public int? AssignedToUserId { get; set; }
        public int TeamId { get; set; }
    }
}