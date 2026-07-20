using TaskTracker.Domain.Common;
using TaskTracker.Domain.Enums;

namespace TaskTracker.Domain.Entities
{
    public class TaskItem : BaseEntity
    {
        public required string Title { get; set; }

        public string? Description { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? DueDate { get; set; }

        public DateTime? CompletedDate { get; set; }

        public TaskPriority Priority { get; set; }

        public TaskItemStatus Status { get; set; }

        // Görevi oluşturan kullanıcı
        public int CreatedByUserId { get; set; }

        public User CreatedByUser { get; set; } = null!;

        // Görevin atandığı kullanıcı
        public int? AssignedToUserId { get; set; }

        public User? AssignedToUser { get; set; }

        public int CategoryId { get; set; }

        public Category Category { get; set; } = null!;
        public int TeamId { get; set; }

        public Team Team { get; set; } = null!;
    }
}