using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
}