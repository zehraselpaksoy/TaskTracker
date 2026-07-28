using TaskTracker.Application.DTOs.Activity;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Application.Interfaces.Services;
using TaskTracker.Domain.Entities;
using TaskTracker.Domain.Enums;

namespace TaskTracker.Application.Services;

public class ActivityService : IActivityService
{
    private readonly IUnitOfWork _unitOfWork;

    public ActivityService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task LogAsync(
        int teamId,
        int userId,
        int? taskId,
        ActivityType type,
        string description)
    {
        var activity = new Activity
        {
            TeamId = teamId,
            UserId = userId,
            TaskId = taskId,
            Type = type,
            Description = description,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Activities.AddAsync(activity);

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<List<ActivityDto>> GetTeamActivitiesAsync(
        int teamId,
        int take = 50)
    {
        var activities =
            await _unitOfWork.Activities
                .GetByTeamIdAsync(teamId, take);

        return activities
            .Select(x => new ActivityDto
            {
                Id = x.Id,
                TeamId = x.TeamId,
                TaskId = x.TaskId,
                Description = x.Description,
                Type = x.Type,
                CreatedAt = x.CreatedAt,
                UserName =
                    $"{x.User.FirstName} {x.User.LastName}"
            })
            .ToList();
    }
}