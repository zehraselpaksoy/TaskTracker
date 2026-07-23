using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TaskTracker.Application.DTOs.Reports
{
    public class UpcomingTaskDto
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public DateTime DueDate { get; set; }

        public string TeamName { get; set; } = string.Empty;

        public string Priority { get; set; } = string.Empty;

        public int RemainingDays { get; set; }
    }
}
