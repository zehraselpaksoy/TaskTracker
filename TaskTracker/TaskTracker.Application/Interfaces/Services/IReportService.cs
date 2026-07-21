using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskTracker.Application.DTOs.Reports;

namespace TaskTracker.Application.Interfaces.Services
{
    public interface IReportService
    {
        Task<TeamSummaryResponse> GetTeamSummaryAsync(int teamId);
    }
}
