namespace TaskTracker.Application.DTOs.Teams
{
    public class TeamDetailDto
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string LeaderName { get; set; } = string.Empty;

        public int MemberCount { get; set; }

        public DateTime CreatedAt { get; set; }

        public List<TeamMemberDto> Members { get; set; } = new();
    }
}