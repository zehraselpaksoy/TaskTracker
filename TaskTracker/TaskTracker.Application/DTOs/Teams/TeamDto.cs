using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TaskTracker.Application.DTOs.Teams
{
    public class TeamDto
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public required string LeaderName { get; set; }
        public int MemberCount { get; set; } 
        public DateTime CreatedAt { get; set; }
    }
}
