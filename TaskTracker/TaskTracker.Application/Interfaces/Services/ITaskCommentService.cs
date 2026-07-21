using TaskTracker.Application.DTOs.Comments;

namespace TaskTracker.Application.Interfaces.Services
{
    public interface ITaskCommentService
    {
        Task<List<CommentDto>> GetCommentsByTaskIdAsync(
            int taskId,
            int currentUserId);

        Task<CommentDto?> GetCommentByIdAsync(
            int commentId,
            int currentUserId);

        Task<CommentDto> CreateCommentAsync(
            int taskId,
            CreateCommentDto createCommentDto,
            int currentUserId);

        Task<CommentDto> UpdateCommentAsync(
            int commentId,
            UpdateCommentDto updateCommentDto,
            int currentUserId);

        Task DeleteCommentAsync(
            int commentId,
            int currentUserId);
        Task DeleteAttachmentAsync(
            int attachmentId,
            int currentUserId);
    }
}