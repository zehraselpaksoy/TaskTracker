namespace TaskTracker.Application.DTOs.Comments
{
    public class CommentDto
    {
        public int Id { get; set; }

        public string Content { get; set; } = string.Empty;

        public int UserId { get; set; }

        public string UserFullName { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public List<CommentAttachmentDto> Attachments { get; set; }
            = new();
    }
}