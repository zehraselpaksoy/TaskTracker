using TaskTracker.Domain.Common;
using TaskTracker.Domain.Enums;

namespace TaskTracker.Domain.Entities;

public class TeamInvitation : BaseEntity
{
    public int TeamId { get; set; }

    public Team Team { get; set; } = null!;

    public required string Email { get; set; }

    public int InvitedByUserId { get; set; }

    public int? InvitedUserId { get; set; }

    public required string TokenHash { get; set; }

    public TeamInvitationStatus Status { get; set; }
        = TeamInvitationStatus.Pending;

    public DateTime ExpiresAtUtc { get; set; }

    public DateTime? RespondedAtUtc { get; set; }
}