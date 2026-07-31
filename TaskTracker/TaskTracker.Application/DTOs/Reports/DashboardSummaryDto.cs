using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TaskTracker.Application.DTOs.Reports
{
    public class DashboardSummaryDto
    {
        public int TotalTasks { get; set; }

        public int TodoTasks { get; set; }

        public int InProgressTasks { get; set; }

        public int CompletedTasks { get; set; }

        public int OverdueTasks { get; set; }

        public int MyTasks { get; set; }
        public List<OverdueTaskDto> OverdueTaskItems { get; set; }
    }
}
