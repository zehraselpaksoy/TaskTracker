using Microsoft.AspNetCore.Http;

namespace TaskTracker.Application.DTOs.Comments
{
    public class CreateCommentDto
    {
        public string Content { get; set; } = string.Empty;

        public List<IFormFile> Files { get; set; } = new();
    }
}