using Microsoft.Extensions.DependencyInjection;
using TaskTracker.Application.Interfaces.Services;
using TaskTracker.Application.Services;

namespace TaskTracker.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<IAuthService, AuthService>();
            services.AddScoped<ITaskService, TaskService>();
            services.AddScoped<ITeamService, TeamService>();
            services.AddScoped<ITaskCommentService, TaskCommentService>();
            services.AddScoped<IReportService, ReportService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IActivityService, ActivityService>();
            services.AddScoped<IDeviceTokenService,DeviceTokenService>();

            return services;
        }
    }
}