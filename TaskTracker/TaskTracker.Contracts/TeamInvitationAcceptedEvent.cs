namespace TaskTracker.Contracts;

public sealed class TeamInvitationAcceptedEvent
{
    public int TeamId { get; set; }

    public string TeamName { get; set; } = string.Empty;

    public int LeaderUserId { get; set; }

    public int AcceptedByUserId { get; set; }

    public string AcceptedByUserName { get; set; } = string.Empty;
}