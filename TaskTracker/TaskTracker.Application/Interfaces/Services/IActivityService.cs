using TaskTracker.Application.DTOs.Activity;
using TaskTracker.Domain.Enums;

namespace TaskTracker.Application.Interfaces.Services;

public interface IActivityService
{
    Task LogAsync(
        int teamId,
        int userId,
        int? taskId,
        ActivityType type,
        string description);

    Task<List<ActivityDto>> GetTeamActivitiesAsync(
        int teamId,
        int take = 50);
}