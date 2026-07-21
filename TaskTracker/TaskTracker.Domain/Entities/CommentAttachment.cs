using TaskTracker.Domain.Common;

namespace TaskTracker.Domain.Entities;

public class CommentAttachment : BaseEntity
{
    public int TaskCommentId { get; set; }

    public TaskComment TaskComment { get; set; } = null!;

    public string OriginalFileName { get; set; } = string.Empty;

    public string ObjectKey { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public long FileSize { get; set; }
}