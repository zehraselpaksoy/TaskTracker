namespace TaskTracker.Contracts.Events;

public sealed record TaskCommentAddedEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();

    public int TaskId { get; init; }

    public string TaskTitle { get; init; } = string.Empty;

    public int CommentedByUserId { get; init; }

    public string CommentedByUserName { get; init; } = string.Empty;

    public string CommentPreview { get; init; } = string.Empty;

    public List<int> RecipientUserIds { get; init; } = [];

    public DateTime OccurredAtUtc { get; init; } = DateTime.UtcNow;
}