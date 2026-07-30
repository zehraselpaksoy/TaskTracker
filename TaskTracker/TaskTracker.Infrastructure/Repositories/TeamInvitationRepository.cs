using Microsoft.EntityFrameworkCore;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Domain.Entities;
using TaskTracker.Domain.Enums;
using TaskTracker.Infrastructure.Context;

namespace TaskTracker.Infrastructure.Repositories;

public sealed class TeamInvitationRepository
    : Repository<TeamInvitation>, ITeamInvitationRepository
{
    public TeamInvitationRepository(
        TaskTrackerDbContext context)
        : base(context)
    {
    }

    public async Task<TeamInvitation?> GetByTokenHashAsync(
        string tokenHash)
    {
        return await _context.TeamInvitations
            .Include(invitation => invitation.Team)
            .FirstOrDefaultAsync(invitation =>
                invitation.TokenHash == tokenHash);
    }

    public async Task<TeamInvitation?> GetPendingByTeamAndEmailAsync(
        int teamId,
        string email)
    {
        var normalizedEmail = email
            .Trim()
            .ToLowerInvariant();

        return await _context.TeamInvitations
            .AsNoTracking()
            .FirstOrDefaultAsync(invitation =>
                invitation.TeamId == teamId &&
                invitation.Email == normalizedEmail &&
                invitation.Status ==
                    TeamInvitationStatus.Pending);
    }

    public async Task<List<TeamInvitation>> GetPendingForUserAsync(
        int userId,
        string email)
    {
        var normalizedEmail = email
            .Trim()
            .ToLowerInvariant();

        return await _context.TeamInvitations
            .AsNoTracking()
            .Include(invitation => invitation.Team)
            .Where(invitation =>
                invitation.Status ==
                    TeamInvitationStatus.Pending &&
                (
                    invitation.InvitedUserId == userId ||
                    invitation.Email == normalizedEmail
                ))
            .OrderByDescending(invitation =>
                invitation.CreatedAt)
            .ToListAsync();
    }
}