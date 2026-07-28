using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskTracker.Application.Interfaces.Services;

namespace TaskTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("teams/{teamId}/summary")]
    public async Task<IActionResult> GetTeamSummary(int teamId)
    {
        var summary = await _reportService.GetTeamSummaryAsync(teamId);

        return Ok(summary);
    }

    [HttpGet("dashboard-summary")]
    public async Task<IActionResult> GetDashboardSummary()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null ||
            !int.TryParse(userIdClaim.Value, out var userId))
        {
            return Unauthorized();
        }

        var summary = await _reportService.GetDashboardSummaryAsync(userId);

        return Ok(summary);
    }

    [HttpGet("weekly-progress")]
    public async Task<IActionResult> GetWeeklyProgress()
    {
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier);

        if (userIdClaim == null ||
            !int.TryParse(userIdClaim.Value, out var userId))
        {
            return Unauthorized();
        }

        var result =
            await _reportService.GetWeeklyProgressAsync(userId);

        return Ok(result);
    }

    [HttpGet("upcoming-deadlines")]
    public async Task<IActionResult> GetUpcomingDeadlines()
    {
        var userIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier);

        if (
            userIdClaim is null ||
            !int.TryParse(userIdClaim.Value, out var userId)
        )
        {
            return Unauthorized();
        }

        var result =
            await _reportService
                .GetUpcomingDeadlinesAsync(userId);

        return Ok(result);
    }
}