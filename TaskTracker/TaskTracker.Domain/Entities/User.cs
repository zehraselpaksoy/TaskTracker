using TaskTracker.Domain.Common;

namespace TaskTracker.Domain.Entities
{
    public class User : BaseEntity
    {
        public required string FirstName { get; set; }

        public required string LastName { get; set; }

        public required string Email { get; set; }

        public required string PasswordHash { get; set; }

        // Kullanıcının oluşturduğu görevler
        public ICollection<TaskItem> CreatedTasks { get; set; }
            = new List<TaskItem>();

        // Kullanıcıya atanan görevler
        public ICollection<TaskItem> AssignedTasks { get; set; }
            = new List<TaskItem>();
        public ICollection<TeamMember> TeamMemberships { get; set; }
            = new List<TeamMember>();
        public ICollection<TaskComment> Comments { get; set; }
            = new List<TaskComment>();

        public ICollection<UserDeviceToken> DeviceTokens { get; set; } = new List<UserDeviceToken>();
    }
}