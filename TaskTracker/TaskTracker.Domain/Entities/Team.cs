using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskTracker.Domain.Common;

namespace TaskTracker.Domain.Entities
{
    public class Team : BaseEntity
    {
        public required string Name { get; set; }

        public ICollection<TeamMember> Members { get; set; }
            = new List<TeamMember>();

        public ICollection<TaskItem> Tasks { get; set; }
            = new List<TaskItem>();
        public ICollection<TeamInvitation> Invitations { get; set; }
            = new List<TeamInvitation>();
    }
}
