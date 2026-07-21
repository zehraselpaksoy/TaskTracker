using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Minio;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Application.Interfaces.Services;
using TaskTracker.Application.Interfaces.Storage;
using TaskTracker.Infrastructure.Context;
using TaskTracker.Infrastructure.Identity;
using TaskTracker.Infrastructure.Repositories;
using TaskTracker.Infrastructure.Storage;

namespace TaskTracker.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        AddDatabaseServices(services, configuration);
        AddMinioServices(services, configuration);
        AddRepositories(services);
        AddIdentityServices(services, configuration);

        services.AddScoped<IUnitOfWork, UnitOfWork>();

        return services;
    }

    private static void AddDatabaseServices(
        IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString =
            configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "DefaultConnection bağlantı bilgisi bulunamadı.");

        services.AddDbContext<TaskTrackerDbContext>(options =>
        {
            options.UseSqlServer(
                connectionString,
                sqlOptions =>
                {
                    sqlOptions.MigrationsAssembly(
                        typeof(TaskTrackerDbContext).Assembly.FullName);

                    sqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(10),
                        errorNumbersToAdd: null);
                });
        });
    }

    private static void AddMinioServices(
        IServiceCollection services,
        IConfiguration configuration)
    {
        var minioSection = configuration.GetSection("Minio");

        if (!minioSection.Exists())
        {
            throw new InvalidOperationException(
                "Minio yapılandırma bölümü bulunamadı.");
        }

        services.Configure<MinioSettings>(minioSection);

        var minioSettings = minioSection.Get<MinioSettings>()
            ?? throw new InvalidOperationException(
                "Minio yapılandırması okunamadı.");

        ValidateMinioSettings(minioSettings);

        services.AddSingleton<IMinioClient>(_ =>
            new MinioClient()
                .WithEndpoint(minioSettings.Endpoint)
                .WithCredentials(
                    minioSettings.AccessKey,
                    minioSettings.SecretKey)
                .WithSSL(minioSettings.UseSSL)
                .Build());

        services.AddScoped<
            IFileStorageService,
            MinioFileStorageService>();
    }

    private static void AddRepositories(
        IServiceCollection services)
    {
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<ITaskItemRepository, TaskItemRepository>();
        services.AddScoped<ITeamRepository, TeamRepository>();
        services.AddScoped<ITeamMemberRepository, TeamMemberRepository>();
        services.AddScoped<ITaskCommentRepository, TaskCommentRepository>();

        services.AddScoped<
            ICommentAttachmentRepository,
            CommentAttachmentRepository>();
    }

    private static void AddIdentityServices(
        IServiceCollection services,
        IConfiguration configuration)
    {
        var jwtSection = configuration.GetSection("Jwt");

        if (!jwtSection.Exists())
        {
            throw new InvalidOperationException(
                "Jwt yapılandırma bölümü bulunamadı.");
        }

        services.Configure<JwtSettings>(jwtSection);

        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtService, JwtService>();
    }

    private static void ValidateMinioSettings(
        MinioSettings settings)
    {
        if (string.IsNullOrWhiteSpace(settings.Endpoint))
        {
            throw new InvalidOperationException(
                "Minio:Endpoint yapılandırması bulunamadı.");
        }

        if (string.IsNullOrWhiteSpace(settings.AccessKey))
        {
            throw new InvalidOperationException(
                "Minio:AccessKey yapılandırması bulunamadı.");
        }

        if (string.IsNullOrWhiteSpace(settings.SecretKey))
        {
            throw new InvalidOperationException(
                "Minio:SecretKey yapılandırması bulunamadı.");
        }

        if (string.IsNullOrWhiteSpace(settings.BucketName))
        {
            throw new InvalidOperationException(
                "Minio:BucketName yapılandırması bulunamadı.");
        }
    }
}