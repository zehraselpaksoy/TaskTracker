using TaskTracker.Domain.Common;
using TaskTracker.Domain.Enums;

namespace TaskTracker.Domain.Entities;

public class Activity : BaseEntity
{
    public int TeamId { get; set; }

    public int UserId { get; set; }

    public int? TaskId { get; set; }

    public ActivityType Type { get; set; }

    public string Description { get; set; } = string.Empty;

    public Team Team { get; set; } = null!;

    public User User { get; set; } = null!;

    public TaskItem? Task { get; set; }
}