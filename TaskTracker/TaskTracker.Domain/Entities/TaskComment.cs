using TaskTracker.Domain.Common;

namespace TaskTracker.Domain.Entities
{
    public class TaskComment : BaseEntity
    {
        public required string Content { get; set; }

        public int TaskItemId { get; set; }

        public TaskItem TaskItem { get; set; } = null!;

        public int UserId { get; set; }

        public User User { get; set; } = null!;

        public ICollection<CommentAttachment> Attachments { get; set; }
            = new List<CommentAttachment>();
    }
}