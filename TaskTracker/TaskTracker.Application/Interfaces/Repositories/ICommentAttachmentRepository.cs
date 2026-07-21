using TaskTracker.Domain.Entities;

namespace TaskTracker.Application.Interfaces.Repositories;

public interface ICommentAttachmentRepository
    : IRepository<CommentAttachment>
{
    Task<CommentAttachment?> GetByIdWithDetailsAsync(
        int attachmentId);
}