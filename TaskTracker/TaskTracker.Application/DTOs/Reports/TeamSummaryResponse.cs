namespace TaskTracker.Application.DTOs.Reports;

public class TeamSummaryResponse
{
    public int TotalTasks { get; set; }

    public int TodoTasks { get; set; }

    public int InProgressTasks { get; set; }

    public int DoneTasks { get; set; }

    public int OverdueTasks { get; set; }
    public double CompletionRate { get; set; }
}