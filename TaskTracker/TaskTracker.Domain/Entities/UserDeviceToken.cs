using TaskTracker.Domain.Common;

namespace TaskTracker.Domain.Entities;

public class UserDeviceToken : BaseEntity
{
    public int UserId { get; set; }

    public required string Token { get; set; }

    public required string Platform { get; set; }

    public User User { get; set; } = null!;
}