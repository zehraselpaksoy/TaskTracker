using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskTracker.Application.DTOs.Teams;
using TaskTracker.Application.Interfaces.Services;

namespace TaskTracker.API.Controllers;

[Authorize]
[ApiController]
[Route("api")]
public sealed class TeamInvitationsController : ControllerBase
{
    private readonly ITeamInvitationService
        _teamInvitationService;

    public TeamInvitationsController(
        ITeamInvitationService teamInvitationService)
    {
        _teamInvitationService =
            teamInvitationService;
    }

    [HttpPost("teams/{teamId:int}/invitations")]
    public async Task<IActionResult> SendInvitation(
        int teamId,
        [FromBody] SendTeamInvitationDto invitationDto)
    {
        var currentUserId = GetCurrentUserId();

        await _teamInvitationService.SendAsync(
            teamId,
            invitationDto,
            currentUserId);

        return Ok(new
        {
            message = "Takım daveti başarıyla gönderildi."
        });
    }

    [HttpGet("invitations/my")]
    public async Task<ActionResult<List<TeamInvitationDto>>>
        GetMyPendingInvitations()
    {
        var currentUserId = GetCurrentUserId();

        var invitations =
            await _teamInvitationService
                .GetMyPendingInvitationsAsync(
                    currentUserId);

        return Ok(invitations);
    }

    [HttpPost("invitations/respond")]
    public async Task<IActionResult> RespondInvitation(
        [FromBody] RespondTeamInvitationDto responseDto)
    {
        var currentUserId = GetCurrentUserId();

        await _teamInvitationService.RespondAsync(
            responseDto,
            currentUserId);

        return Ok(new
        {
            message = responseDto.Accept
                ? "Takım daveti kabul edildi."
                : "Takım daveti reddedildi."
        });
    }

    private int GetCurrentUserId()
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdValue, out var userId))
        {
            throw new UnauthorizedAccessException(
                "Kullanıcı kimliği alınamadı.");
        }

        return userId;
    }
}