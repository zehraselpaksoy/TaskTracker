namespace TaskTracker.Application.DTOs.Comments;

public class CommentAttachmentDto
{
    public int Id { get; set; }

    public string OriginalFileName { get; set; } = string.Empty;

    public string ObjectKey { get; set; } = string.Empty;

    public string ContentType { get; set; } = string.Empty;

    public long FileSize { get; set; }

    public string DownloadUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}