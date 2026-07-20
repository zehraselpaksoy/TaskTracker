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

            return services;
        }
    }
}