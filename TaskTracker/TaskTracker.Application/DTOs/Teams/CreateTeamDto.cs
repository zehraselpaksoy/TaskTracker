using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TaskTracker.Application.DTOs.Teams
{
    public class CreateTeamDto
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;
    }
}
