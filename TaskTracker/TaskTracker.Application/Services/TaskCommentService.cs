using TaskTracker.Application.DTOs.Comments;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Application.Interfaces.Services;
using TaskTracker.Application.Interfaces.Storage;
using TaskTracker.Domain.Entities;
using TaskTracker.Domain.Enums;
using TaskTracker.Application.Interfaces.Messaging;
using TaskTracker.Contracts.Events;

namespace TaskTracker.Application.Services;

public class TaskCommentService : ITaskCommentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFileStorageService _fileStorageService;
    private readonly IActivityService _activityService;
    private readonly IRabbitMqPublisher _rabbitMqPublisher;

    public TaskCommentService(
        IUnitOfWork unitOfWork,
        IFileStorageService fileStorageService,
        IActivityService activityService,
        IRabbitMqPublisher rabbitMqPublisher    )
    {
        _unitOfWork = unitOfWork;
        _fileStorageService = fileStorageService;
        _activityService = activityService;
        _rabbitMqPublisher = rabbitMqPublisher;
    }

    public async Task<List<CommentDto>> GetCommentsByTaskIdAsync(
        int taskId,
        int currentUserId)
    {
        var task = await _unitOfWork.Tasks
            .GetByIdWithDetailsAsync(taskId);

        if (task is null)
        {
            throw new Exception("Görev bulunamadı.");
        }

        var isTeamMember = await _unitOfWork.TeamMembers
            .IsTeamMemberAsync(task.TeamId, currentUserId);

        if (!isTeamMember)
        {
            throw new UnauthorizedAccessException(
                "Bu görevin yorumlarını görüntüleme yetkiniz yok.");
        }

        var comments = await _unitOfWork.TaskComments
            .GetCommentsByTaskIdAsync(taskId);

        var commentDtos = await Task.WhenAll(
            comments.Select(MapToDtoAsync));

        return commentDtos.ToList();
    }

    public async Task<CommentDto?> GetCommentByIdAsync(int commentId,int currentUserId)
    {
        var comment = await _unitOfWork.TaskComments
            .GetByIdWithDetailsAsync(commentId);

        if (comment is null)
        {
            return null;
        }

        var isTeamMember = await _unitOfWork.TeamMembers
            .IsTeamMemberAsync(
                comment.TaskItem.TeamId,
                currentUserId);

        if (!isTeamMember)
        {
            throw new UnauthorizedAccessException(
                "Bu yorumu görüntüleme yetkiniz yok.");
        }

        return await MapToDtoAsync(comment);
    }

    public async Task<CommentDto> CreateCommentAsync(int taskId, CreateCommentDto createCommentDto, int currentUserId)
    {
        var task = await _unitOfWork.Tasks
            .GetByIdWithDetailsAsync(taskId);

        if (task is null)
        {
            throw new Exception("Görev bulunamadı.");
        }

        var isTeamMember = await _unitOfWork.TeamMembers
            .IsTeamMemberAsync(task.TeamId, currentUserId);

        if (!isTeamMember)
        {
            throw new UnauthorizedAccessException(
                "Bu göreve yorum ekleyemezsiniz.");
        }

        if (string.IsNullOrWhiteSpace(createCommentDto.Content))
        {
            throw new ArgumentException(
                "Yorum içeriği boş olamaz.");
        }

        var uploadedObjectKeys = new List<string>();

        try
        {
            var attachments = new List<CommentAttachment>();

            if (createCommentDto.Files is not null)
            {
                foreach (var file in createCommentDto.Files)
                {
                    var objectKey = await _fileStorageService
                        .UploadFileAsync(file);

                    uploadedObjectKeys.Add(objectKey);

                    attachments.Add(new CommentAttachment
                    {
                        OriginalFileName = file.FileName,
                        ObjectKey = objectKey,
                        ContentType = string.IsNullOrWhiteSpace(file.ContentType)
                            ? "application/octet-stream"
                            : file.ContentType,
                        FileSize = file.Length,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            var comment = new TaskComment
            {
                Content = createCommentDto.Content.Trim(),
                TaskItemId = taskId,
                UserId = currentUserId,
                Attachments = attachments
            };

            _unitOfWork.TaskComments.Add(comment);

            await _unitOfWork.SaveChangesAsync();


            await _activityService.LogAsync(
                teamId: task.TeamId,
                userId: currentUserId,
                taskId: task.Id,
                type: ActivityType.CommentAdded,
                description: $"\"{task.Title}\" görevine yorum eklendi."
            );
            var recipientUserIds = new HashSet<int>();

            // Görevi oluşturan kullanıcı, yorumu yazan kişi değilse ekle.
            if (task.CreatedByUserId != currentUserId)
            {
                recipientUserIds.Add(task.CreatedByUserId);
            }

            // Göreve atanan kullanıcı varsa ve yorumu yazan kişi değilse ekle.
            if (task.AssignedToUserId.HasValue &&
                task.AssignedToUserId.Value != currentUserId)
            {
                recipientUserIds.Add(task.AssignedToUserId.Value);
            }

            if (recipientUserIds.Count > 0)
            {
                var commentedByUser = await _unitOfWork.Users
                    .GetByIdAsync(currentUserId);

                var commentedByUserName = commentedByUser is null
                    ? "Bir takım üyesi"
                    : $"{commentedByUser.FirstName} {commentedByUser.LastName}".Trim();

                var commentContent = comment.Content;

                var commentPreview = commentContent.Length > 100
                    ? $"{commentContent[..100]}..."
                    : commentContent;

                var commentAddedEvent = new TaskCommentAddedEvent
                {
                    TaskId = task.Id,
                    TaskTitle = task.Title,
                    CommentedByUserId = currentUserId,
                    CommentedByUserName = commentedByUserName,
                    CommentPreview = commentPreview,
                    RecipientUserIds = recipientUserIds.ToList()
                };

                await _rabbitMqPublisher.PublishAsync(
                    queueName: "task-comment-added-queue",
                    message: commentAddedEvent);
            }

            var createdComment = await _unitOfWork.TaskComments
                .GetByIdWithDetailsAsync(comment.Id)
                ?? throw new Exception("Yorum oluşturulamadı.");

            return await MapToDtoAsync(createdComment);
        }
        catch
        {
            await DeleteUploadedFilesSafelyAsync(uploadedObjectKeys);
            throw;
        }
    }

    public async Task<CommentDto> UpdateCommentAsync(int commentId,UpdateCommentDto updateCommentDto,int currentUserId)
    {
        var comment = await _unitOfWork.TaskComments
            .GetByIdWithDetailsAsync(commentId);

        if (comment is null)
        {
            throw new Exception("Yorum bulunamadı.");
        }

        if (comment.UserId != currentUserId)
        {
            throw new UnauthorizedAccessException(
                "Yalnızca kendi yorumunuzu düzenleyebilirsiniz.");
        }

        if (string.IsNullOrWhiteSpace(updateCommentDto.Content))
        {
            throw new ArgumentException(
                "Yorum içeriği boş olamaz.");
        }

        comment.Content = updateCommentDto.Content.Trim();
        comment.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.TaskComments.Update(comment);

        await _unitOfWork.SaveChangesAsync();

        await _activityService.LogAsync(
            teamId: comment.TaskItem.TeamId,
            userId: currentUserId,
            taskId: comment.TaskItemId,
            type: ActivityType.CommentUpdated,
            description:
                $"\"{comment.TaskItem.Title}\" görevindeki yorum güncellendi."
        );

        return await MapToDtoAsync(comment);
    }

    public async Task DeleteCommentAsync(int commentId,int currentUserId)
    {
        var comment = await _unitOfWork.TaskComments
            .GetByIdWithDetailsAsync(commentId);

        if (comment is null)
        {
            throw new Exception("Yorum bulunamadı.");
        }

        var isLeader = await _unitOfWork.TeamMembers
            .IsTeamLeaderAsync(
                comment.TaskItem.TeamId,
                currentUserId);

        var isOwner = comment.UserId == currentUserId;

        if (!isLeader && !isOwner)
        {
            throw new UnauthorizedAccessException(
                "Bu yorumu silme yetkiniz yok.");
        }

        var objectKeys = comment.Attachments
            .Where(attachment =>
                !string.IsNullOrWhiteSpace(attachment.ObjectKey))
            .Select(attachment => attachment.ObjectKey)
            .ToList();

        var teamId = comment.TaskItem.TeamId;
        var taskId = comment.TaskItemId;
        var taskTitle = comment.TaskItem.Title;
                
        _unitOfWork.TaskComments.Delete(comment);

        await _unitOfWork.SaveChangesAsync();

        await _activityService.LogAsync(
            teamId: teamId,
            userId: currentUserId,
            taskId: taskId,
            type: ActivityType.CommentDeleted,
            description:
                $"\"{taskTitle}\" görevindeki yorum silindi."
        );

        await DeleteUploadedFilesSafelyAsync(objectKeys);
    }

    private async Task<CommentDto> MapToDtoAsync(
        TaskComment comment)
    {
        var attachmentDtos = await Task.WhenAll(
            comment.Attachments.Select(MapAttachmentToDtoAsync));

        return new CommentDto
        {
            Id = comment.Id,
            Content = comment.Content,
            UserId = comment.UserId,

            UserFullName =
                $"{comment.User.FirstName} {comment.User.LastName}".Trim(),

            CreatedAt = comment.CreatedAt,

            Attachments = attachmentDtos.ToList()
        };
    }

    private async Task<CommentAttachmentDto> MapAttachmentToDtoAsync(
        CommentAttachment attachment)
    {
        var downloadUrl = string.Empty;

        if (!string.IsNullOrWhiteSpace(attachment.ObjectKey))
        {
            downloadUrl = await _fileStorageService
                .GetFileUrlAsync(
                    attachment.ObjectKey,
                    expiryInMinutes: 60);
        }

        return new CommentAttachmentDto
        {
            Id = attachment.Id,
            OriginalFileName = attachment.OriginalFileName,
            ObjectKey = attachment.ObjectKey,
            ContentType = attachment.ContentType,
            FileSize = attachment.FileSize,
            CreatedAt = attachment.CreatedAt,
            DownloadUrl = downloadUrl
        };
    }

    private async Task DeleteUploadedFilesSafelyAsync(
        IEnumerable<string> objectKeys)
    {
        foreach (var objectKey in objectKeys.Distinct())
        {
            if (string.IsNullOrWhiteSpace(objectKey))
            {
                continue;
            }

            try
            {
                await _fileStorageService.DeleteFileAsync(objectKey);
            }
            catch
            {                
            }
        }
    }
    public async Task DeleteAttachmentAsync(
    int attachmentId,
    int currentUserId)
    {
        var attachment = await _unitOfWork.CommentAttachments
            .GetByIdWithDetailsAsync(attachmentId);

        if (attachment is null)
        {
            throw new Exception("Dosya bulunamadı.");
        }

        var comment = attachment.TaskComment;

        var isLeader = await _unitOfWork.TeamMembers
            .IsTeamLeaderAsync(
                comment.TaskItem.TeamId,
                currentUserId);

        var isOwner = comment.UserId == currentUserId;

        if (!isLeader && !isOwner)
        {
            throw new UnauthorizedAccessException(
                "Bu dosyayı silme yetkiniz yok.");
        }

        if (!string.IsNullOrWhiteSpace(attachment.ObjectKey))
        {
            var exists = await _fileStorageService
                .FileExistsAsync(attachment.ObjectKey);

            if (exists)
            {
                await _fileStorageService
                    .DeleteFileAsync(attachment.ObjectKey);
            }
        }

        _unitOfWork.CommentAttachments.Delete(attachment);

        await _unitOfWork.SaveChangesAsync();
    }
}