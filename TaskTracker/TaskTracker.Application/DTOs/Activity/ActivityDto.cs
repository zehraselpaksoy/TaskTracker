using TaskTracker.Domain.Enums;

namespace TaskTracker.Application.DTOs.Activity;

public class ActivityDto
{
    public int Id { get; set; }

    public int TeamId { get; set; }

    public int? TaskId { get; set; }

    public string Description { get; set; } = string.Empty;

    public string UserName { get; set; } = string.Empty;

    public ActivityType Type { get; set; }

    public DateTime CreatedAt { get; set; }
}