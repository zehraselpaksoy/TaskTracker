using System.Security.Cryptography;
using System.Text;
using TaskTracker.Application.DTOs.Teams;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Application.Interfaces.Services;
using TaskTracker.Domain.Entities;
using TaskTracker.Domain.Enums;
using TaskTracker.Application.Interfaces.Messaging;
using TaskTracker.Contracts.Events;
using TaskTracker.Contracts;


namespace TaskTracker.Application.Services;

public sealed class TeamInvitationService : ITeamInvitationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ITeamInvitationEmailService _emailService;
    private readonly ITeamInvitationLinkService _linkService;
    private readonly IRabbitMqPublisher _rabbitMqPublisher;

    public TeamInvitationService(
        IUnitOfWork unitOfWork,
        ITeamInvitationEmailService emailService,
        ITeamInvitationLinkService linkService,
        IRabbitMqPublisher rabbitMqPublisher)
    {
        _unitOfWork = unitOfWork;
        _emailService = emailService;
        _linkService = linkService;
        _rabbitMqPublisher = rabbitMqPublisher;
    }

    private static string CreateToken()
    {
        var tokenBytes = RandomNumberGenerator.GetBytes(32);

        return Convert.ToHexString(tokenBytes);
    }

    private static string HashToken(string token)
    {
        var tokenBytes = Encoding.UTF8.GetBytes(token);
        var hashBytes = SHA256.HashData(tokenBytes);

        return Convert.ToHexString(hashBytes);
    }
    public async Task SendAsync(
    int teamId,
    SendTeamInvitationDto invitationDto,
    int currentUserId)
    {
        var email = invitationDto.Email
            .Trim()
            .ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ArgumentException(
                "Davet gönderilecek e-posta adresi boş olamaz.");
        }

        var team = await _unitOfWork.Teams
            .GetByIdAsync(teamId);

        if (team is null)
        {
            throw new Exception("Takım bulunamadı.");
        }

        var isLeader = await _unitOfWork.TeamMembers
            .IsTeamLeaderAsync(teamId, currentUserId);

        if (!isLeader)
        {
            throw new UnauthorizedAccessException(
                "Takıma yalnızca takım lideri davet gönderebilir.");
        }

        var invitedUser = await _unitOfWork.Users
            .GetByEmailAsync(email);

        if (invitedUser is not null)
        {
            var isAlreadyMember = await _unitOfWork.TeamMembers
                .IsTeamMemberAsync(teamId, invitedUser.Id);

            if (isAlreadyMember)
            {
                throw new Exception(
                    "Bu kullanıcı zaten takımın üyesidir.");
            }
        }

        var pendingInvitation =
            await _unitOfWork.TeamInvitations
                .GetPendingByTeamAndEmailAsync(teamId, email);

        if (pendingInvitation is not null)
        {
            throw new Exception(
                "Bu e-posta adresine daha önce bekleyen bir davet gönderildi.");
        }

        var invitedByUser = await _unitOfWork.Users
            .GetByIdAsync(currentUserId);

        if (invitedByUser is null)
        {
            throw new Exception("Davet gönderen kullanıcı bulunamadı.");
        }

        var rawToken = CreateToken();

        var invitation = new TeamInvitation
        {
            TeamId = teamId,
            Email = email,
            InvitedByUserId = currentUserId,
            InvitedUserId = invitedUser?.Id,
            TokenHash = HashToken(rawToken),
            Status = TeamInvitationStatus.Pending,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(7)
        };

        _unitOfWork.TeamInvitations.Add(invitation);

        await _unitOfWork.SaveChangesAsync();

        var invitationLink =
            _linkService.CreateInvitationLink(rawToken);

        var invitedByUserName =
            $"{invitedByUser.FirstName} {invitedByUser.LastName}".Trim();

        await _emailService.SendInvitationAsync(
            recipientEmail: email,
            teamName: team.Name,
            invitedByUserName: invitedByUserName,
            invitationLink: invitationLink);
    }
    public async Task RespondAsync(
    RespondTeamInvitationDto responseDto,
    int currentUserId)
    {
        if (string.IsNullOrWhiteSpace(responseDto.Token))
        {
            throw new ArgumentException(
                "Davet tokenı boş olamaz.");
        }

        var tokenHash = HashToken(
            responseDto.Token.Trim());

        var invitation = await _unitOfWork.TeamInvitations
            .GetByTokenHashAsync(tokenHash);

        if (invitation is null)
        {
            throw new Exception(
                "Davet bulunamadı veya bağlantı geçersiz.");
        }

        if (invitation.Status != TeamInvitationStatus.Pending)
        {
            throw new Exception(
                "Bu davet daha önce cevaplanmış.");
        }

        if (invitation.ExpiresAtUtc <= DateTime.UtcNow)
        {
            invitation.Status = TeamInvitationStatus.Expired;
            invitation.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.TeamInvitations.Update(invitation);
            await _unitOfWork.SaveChangesAsync();

            throw new Exception("Davetin süresi dolmuş.");
        }

        var currentUser = await _unitOfWork.Users
            .GetByIdAsync(currentUserId);

        if (currentUser is null)
        {
            throw new Exception("Kullanıcı bulunamadı.");
        }

        var currentUserEmail = currentUser.Email
            .Trim()
            .ToLowerInvariant();

        if (currentUserEmail != invitation.Email)
        {
            throw new UnauthorizedAccessException(
                "Bu davet başka bir e-posta adresine gönderilmiş.");
        }

        if (responseDto.Accept)
        {
            var isAlreadyMember = await _unitOfWork.TeamMembers
                .IsTeamMemberAsync(
                    invitation.TeamId,
                    currentUserId);

            if (!isAlreadyMember)
            {
                var teamMember = new TeamMember
                {
                    TeamId = invitation.TeamId,
                    UserId = currentUserId,
                    Role = TeamRole.Member
                };

                _unitOfWork.TeamMembers.Add(teamMember);
            }

            invitation.Status =
                TeamInvitationStatus.Accepted;

            invitation.InvitedUserId = currentUserId;
        }
        else
        {
            invitation.Status =
                TeamInvitationStatus.Rejected;
        }

        invitation.RespondedAtUtc = DateTime.UtcNow;
        invitation.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.TeamInvitations.Update(invitation);

        await _unitOfWork.SaveChangesAsync();
        if (responseDto.Accept)
        {
            var acceptedByUserName =
                $"{currentUser.FirstName} {currentUser.LastName}".Trim();

            var acceptedEvent =
                new TeamInvitationAcceptedEvent
                {
                    TeamId = invitation.TeamId,
                    TeamName = invitation.Team.Name,
                    LeaderUserId = invitation.InvitedByUserId,
                    AcceptedByUserId = currentUserId,
                    AcceptedByUserName = acceptedByUserName
                };

            await _rabbitMqPublisher.PublishAsync(
                queueName:
                    "team-invitation-accepted-queue",
                message: acceptedEvent);
        }
    }
    public async Task<List<TeamInvitationDto>>
    GetMyPendingInvitationsAsync(int currentUserId)
    {
        var currentUser = await _unitOfWork.Users
            .GetByIdAsync(currentUserId);

        if (currentUser is null)
        {
            throw new Exception("Kullanıcı bulunamadı.");
        }

        var invitations =
            await _unitOfWork.TeamInvitations
                .GetPendingForUserAsync(
                    currentUserId,
                    currentUser.Email);

        return invitations
            .Where(invitation =>
                invitation.ExpiresAtUtc > DateTime.UtcNow)
            .Select(invitation => new TeamInvitationDto
            {
                Id = invitation.Id,
                TeamId = invitation.TeamId,
                TeamName = invitation.Team.Name,
                Email = invitation.Email,
                Status = invitation.Status,
                ExpiresAtUtc = invitation.ExpiresAtUtc,
                CreatedAt = invitation.CreatedAt
            })
            .ToList();
    }
}