using TaskTracker.Domain.Entities;

namespace TaskTracker.Application.Interfaces.Repositories;

public interface ITeamInvitationRepository
    : IRepository<TeamInvitation>
{
    Task<TeamInvitation?> GetByTokenHashAsync(
        string tokenHash);

    Task<TeamInvitation?> GetPendingByTeamAndEmailAsync(
        int teamId,
        string email);

    Task<List<TeamInvitation>> GetPendingForUserAsync(
        int userId,
        string email);
}