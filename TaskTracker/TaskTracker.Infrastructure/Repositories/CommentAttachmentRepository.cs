using Microsoft.EntityFrameworkCore;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Domain.Entities;
using TaskTracker.Infrastructure.Context;

namespace TaskTracker.Infrastructure.Repositories;

public class CommentAttachmentRepository
    : Repository<CommentAttachment>,
      ICommentAttachmentRepository
{
    public CommentAttachmentRepository(
        TaskTrackerDbContext context)
        : base(context)
    {
    }

    public async Task<CommentAttachment?> GetByIdWithDetailsAsync(
        int attachmentId)
    {
        return await _context.CommentAttachments
            .Include(attachment => attachment.TaskComment)
                .ThenInclude(comment => comment.TaskItem)
            .FirstOrDefaultAsync(
                attachment => attachment.Id == attachmentId);
    }
}