using Microsoft.AspNetCore.Mvc;
using TaskTracker.Application.Interfaces.Services;

namespace TaskTracker.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ActivitiesController : ControllerBase
{
    private readonly IActivityService _activityService;

    public ActivitiesController(
        IActivityService activityService)
    {
        _activityService = activityService;
    }

    [HttpGet("team/{teamId}")]
    public async Task<IActionResult> GetTeamActivities(
        int teamId)
    {
        var activities =
            await _activityService.GetTeamActivitiesAsync(teamId);

        return Ok(activities);
    }
}
