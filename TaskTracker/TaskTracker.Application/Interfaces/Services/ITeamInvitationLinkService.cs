namespace TaskTracker.Application.Interfaces.Services;

public interface ITeamInvitationLinkService
{
    string CreateInvitationLink(string token);
}