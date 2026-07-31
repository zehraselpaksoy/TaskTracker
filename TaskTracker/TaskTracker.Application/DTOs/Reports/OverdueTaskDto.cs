namespace TaskTracker.Application.DTOs.Reports;

public class OverdueTaskDto
{
    public int Id { get; set; }

    public int TeamId { get; set; }

    public string Title { get; set; } =
        string.Empty;

    public string TeamName { get; set; } =
        string.Empty;

    public DateTime DueDate { get; set; }

    public string Priority { get; set; } =
        string.Empty;

    public int OverdueDays { get; set; }
    
}