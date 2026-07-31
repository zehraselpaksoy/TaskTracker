using TaskTracker.Application.DTOs.Reports;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Application.Interfaces.Services;
using TaskTracker.Domain.Enums;

namespace TaskTracker.Application.Services;

public class ReportService : IReportService
{
    private readonly IUnitOfWork _unitOfWork;

    public ReportService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<TeamSummaryResponse> GetTeamSummaryAsync(int teamId)
    {
        var tasks = await _unitOfWork.Tasks
            .GetTasksByTeamIdAsync(teamId);

        var now = DateTime.UtcNow;

        var totalTasks = tasks.Count;

        var todoTasks = tasks.Count(task =>
            task.Status == TaskItemStatus.Pending);

        var inProgressTasks = tasks.Count(task =>
            task.Status == TaskItemStatus.InProgress);

        var doneTasks = tasks.Count(task =>
            task.Status == TaskItemStatus.Completed);

        var overdueTasks = tasks.Count(task =>
            task.DueDate.HasValue &&
            task.DueDate.Value < now &&
            task.Status != TaskItemStatus.Completed);

        var completionRate = totalTasks == 0
            ? 0
            : Math.Round((double)doneTasks / totalTasks * 100, 2);

        return new TeamSummaryResponse
        {
            TotalTasks = totalTasks,
            TodoTasks = todoTasks,
            InProgressTasks = inProgressTasks,
            DoneTasks = doneTasks,
            OverdueTasks = overdueTasks,
            CompletionRate = completionRate
        };
    }

    public async Task<DashboardSummaryDto>
        GetDashboardSummaryAsync(
            int userId
        )
    {
        var assignedTasks =
            await _unitOfWork.Tasks
                .GetAssignedTasksByUserIdAsync(
                    userId
                );

        var teamTasks =
            await _unitOfWork.Tasks
                .GetTasksByUserTeamMembershipsAsync(
                    userId
                );

        var now = DateTime.UtcNow;
        var today = now.Date;

        var overdueTasks =
            assignedTasks
                .Where(task =>
                    task.DueDate.HasValue &&
                    task.DueDate.Value < now &&
                    task.Status !=
                        TaskItemStatus.Completed
                )
                .OrderBy(task => task.DueDate)
                .ToList();

        return new DashboardSummaryDto
        {
            TotalTasks = teamTasks.Count,

            MyTasks = assignedTasks.Count,

            TodoTasks = assignedTasks.Count(
                task =>
                    task.Status ==
                    TaskItemStatus.Pending
            ),

            InProgressTasks =
                assignedTasks.Count(
                    task =>
                        task.Status ==
                        TaskItemStatus.InProgress
                ),

            CompletedTasks =
                assignedTasks.Count(
                    task =>
                        task.Status ==
                        TaskItemStatus.Completed
                ),

            OverdueTasks =
                overdueTasks.Count,

            OverdueTaskItems =
                overdueTasks
                    .Select(task =>
                        new OverdueTaskDto
                        {
                            Id = task.Id,

                            TeamId =
                                task.TeamId,

                            Title =
                                task.Title,

                            TeamName =
                                task.Team?.Name ??
                                string.Empty,

                            DueDate =
                                task.DueDate!.Value,

                            Priority =
                                task.Priority
                                    .ToString(),

                            OverdueDays =
                                Math.Max(
                                    1,
                                    (
                                        today -
                                        task.DueDate
                                            .Value.Date
                                    ).Days
                                )
                        }
                    )
                    .ToList()
        };
    }
    public async Task<List<WeeklyProgressDto>> GetWeeklyProgressAsync(int userId)
    {
        var tasks = await _unitOfWork.Tasks
            .GetAssignedTasksByUserIdAsync(userId);

        var today = DateTime.UtcNow.Date;

        var result = new List<WeeklyProgressDto>();

        for (var i = 6; i >= 0; i--)
        {
            var date = today.AddDays(-i);

            result.Add(new WeeklyProgressDto
            {
                Day = GetDayName(date.DayOfWeek),

                CreatedTasks = tasks.Count(task =>
                    task.CreatedAt.Date == date),

                CompletedTasks = tasks.Count(task =>
                    task.CompletedDate.HasValue &&
                    task.CompletedDate.Value.Date == date)
            });
        }

        return result;
    }

    private static string GetDayName(DayOfWeek day)
    {
        return day switch
        {
            DayOfWeek.Monday => "Pzt",
            DayOfWeek.Tuesday => "Sal",
            DayOfWeek.Wednesday => "Çar",
            DayOfWeek.Thursday => "Per",
            DayOfWeek.Friday => "Cum",
            DayOfWeek.Saturday => "Cmt",
            DayOfWeek.Sunday => "Paz",
            _ => string.Empty
        };
    }

    public async Task<List<UpcomingTaskDto>>
    GetUpcomingDeadlinesAsync(int userId)
    {
        var tasks = await _unitOfWork.Tasks
            .GetAssignedTasksByUserIdAsync(userId);

        var today = DateTime.UtcNow.Date;
        var endDate = today.AddDays(7);

        return tasks
            .Where(task =>
                task.DueDate.HasValue &&
                task.DueDate.Value.Date >= today &&
                task.DueDate.Value.Date <= endDate &&
                task.Status != TaskItemStatus.Completed)
            .OrderBy(task => task.DueDate)
            .Take(5)
            .Select(task => new UpcomingTaskDto
            {
                Id = task.Id,
                Title = task.Title,
                DueDate = task.DueDate!.Value,
                TeamName = task.Team?.Name ?? string.Empty,
                Priority = task.Priority.ToString(),
                RemainingDays =
                    (task.DueDate.Value.Date - today).Days
            })
            .ToList();
    }
    public async Task<List<OverdueTaskDto>>
    GetOverdueTasksAsync(
        int userId
    )
    {
        var tasks =
            await _unitOfWork.Tasks
                .GetAssignedTasksByUserIdAsync(
                    userId
                );

        var now = DateTime.UtcNow;
        var today = now.Date;

        return tasks
            .Where(task =>
                task.DueDate.HasValue &&
                task.DueDate.Value < now &&
                task.Status !=
                    TaskItemStatus.Completed
            )
            .OrderBy(task => task.DueDate)
            .Select(task =>
                new OverdueTaskDto
                {
                    Id = task.Id,

                    TeamId = task.TeamId,

                    Title = task.Title,

                    TeamName =
                        task.Team?.Name ??
                        string.Empty,

                    DueDate =
                        task.DueDate!.Value,

                    Priority =
                        task.Priority.ToString(),

                    OverdueDays = Math.Max(
                        1,
                        (
                            today -
                            task.DueDate.Value.Date
                        ).Days
                    )
                }
            )
            .ToList();
    }
}