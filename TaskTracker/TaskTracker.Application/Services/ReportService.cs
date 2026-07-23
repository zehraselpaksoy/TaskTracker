using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskTracker.Application.DTOs.Reports;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Application.Interfaces.Services;
using TaskTracker.Domain.Enums;

namespace TaskTracker.Application.Services
{
    public class ReportService : IReportService
    {
        private readonly IUnitOfWork _unitOfWork;

        public ReportService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<TeamSummaryResponse> GetTeamSummaryAsync(int teamId)
        {
            var tasks = await _unitOfWork.Tasks.GetTasksByTeamIdAsync(teamId);

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
        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(
    int userId)
        {
            var tasks =
                await _unitOfWork.Tasks
                    .GetAssignedTasksByUserIdAsync(userId);

            var now = DateTime.UtcNow;

            var totalTasks = tasks.Count;

            var todoTasks = tasks.Count(task =>
                task.Status == TaskItemStatus.Pending);

            var inProgressTasks = tasks.Count(task =>
                task.Status == TaskItemStatus.InProgress);

            var completedTasks = tasks.Count(task =>
                task.Status == TaskItemStatus.Completed);

            var overdueTasks = tasks.Count(task =>
                task.DueDate.HasValue &&
                task.DueDate.Value < now &&
                task.Status != TaskItemStatus.Completed);

            return new DashboardSummaryDto
            {
                TotalTasks = totalTasks,
                TodoTasks = todoTasks,
                InProgressTasks = inProgressTasks,
                CompletedTasks = completedTasks,
                OverdueTasks = overdueTasks,
                MyTasks = totalTasks
            };
        }

    }
}
