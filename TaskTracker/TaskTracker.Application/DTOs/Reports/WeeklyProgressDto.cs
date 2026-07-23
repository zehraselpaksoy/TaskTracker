using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TaskTracker.Application.DTOs.Reports
{
    public class WeeklyProgressDto
    {
        public string Day { get; set; } = string.Empty;

        public int CompletedTasks { get; set; }

        public int CreatedTasks { get; set; }
    }
}
