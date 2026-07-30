namespace TaskTracker.Application.Interfaces.Services;

public interface ITeamInvitationEmailService
{
    Task SendInvitationAsync(
        string recipientEmail,
        string teamName,
        string invitedByUserName,
        string invitationLink,
        CancellationToken cancellationToken = default);
}