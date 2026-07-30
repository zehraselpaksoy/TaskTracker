namespace TaskTracker.Application.DTOs.Teams;

public sealed class RespondTeamInvitationDto
{
    public string Token { get; set; } = string.Empty;

    public bool Accept { get; set; }
}