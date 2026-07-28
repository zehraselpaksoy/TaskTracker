namespace TaskTracker.Contracts.Events;

public sealed record TaskAssignedEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();

    public int TaskId { get; init; }

    public int AssignedUserId { get; init; }

    public string TaskTitle { get; init; } = string.Empty;

    public string AssignedByUserName { get; init; } = string.Empty;

    public DateTime OccurredAtUtc { get; init; } = DateTime.UtcNow;
}