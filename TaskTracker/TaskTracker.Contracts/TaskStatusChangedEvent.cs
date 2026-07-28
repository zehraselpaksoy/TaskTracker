namespace TaskTracker.Contracts.Events;

public sealed record TaskStatusChangedEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();

    public int TaskId { get; init; }

    public string TaskTitle { get; init; } = string.Empty;

    public string PreviousStatus { get; init; } = string.Empty;

    public string NewStatus { get; init; } = string.Empty;

    public int ChangedByUserId { get; init; }

    public string ChangedByUserName { get; init; } = string.Empty;

    public List<int> RecipientUserIds { get; init; } = [];

    public DateTime OccurredAtUtc { get; init; } = DateTime.UtcNow;
}