namespace TaskTracker.Application.DTOs.Users
{
    public class UserSearchResultDto
    {
        public int Id { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;
    }
}