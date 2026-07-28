namespace TaskTracker.Contracts.Events;

public sealed record TeamMemberAddedEvent
{
    public Guid EventId { get; init; } = Guid.NewGuid();

    public int TeamId { get; init; }

    public string TeamName { get; init; } = string.Empty;

    public int AddedUserId { get; init; }

    public string AddedByUserName { get; init; } = string.Empty;

    public DateTime OccurredAtUtc { get; init; } = DateTime.UtcNow;
}