using TaskTracker.Application.DTOs.Teams;

namespace TaskTracker.Application.Interfaces.Services;

public interface ITeamInvitationService
{
    Task SendAsync(
        int teamId,
        SendTeamInvitationDto invitationDto,
        int currentUserId);

    Task RespondAsync(
        RespondTeamInvitationDto responseDto,
        int currentUserId);

    Task<List<TeamInvitationDto>> GetMyPendingInvitationsAsync(
        int currentUserId);
}