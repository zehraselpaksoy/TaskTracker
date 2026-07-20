using TaskTracker.Domain.Enums;

namespace TaskTracker.Application.DTOs.Teams
{
    public class TeamMemberDto
    {
        public int UserId { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public TeamRole Role { get; set; }
    }
}