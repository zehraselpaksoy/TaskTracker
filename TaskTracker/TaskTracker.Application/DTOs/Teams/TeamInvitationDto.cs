using TaskTracker.Domain.Enums;

namespace TaskTracker.Application.DTOs.Teams;

public sealed class TeamInvitationDto
{
    public int Id { get; set; }

    public int TeamId { get; set; }

    public string TeamName { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public TeamInvitationStatus Status { get; set; }

    public DateTime ExpiresAtUtc { get; set; }

    public DateTime CreatedAt { get; set; }
}