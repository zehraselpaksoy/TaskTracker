using TaskTracker.NotificationService.Connections;
using TaskTracker.NotificationService.Messaging;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using TaskTracker.NotificationService.Services;
using Microsoft.EntityFrameworkCore;
using TaskTracker.Infrastructure.Context;


var builder = WebApplication.CreateBuilder(args);
var connectionString =
    builder.Configuration.GetConnectionString(
        "DefaultConnection")
    ?? throw new InvalidOperationException(
        "DefaultConnection baðlantý bilgisi bulunamadý.");

builder.Services.AddDbContextFactory<TaskTrackerDbContext>(
    options =>
    {
        options.UseSqlServer(connectionString);
    });
var firebaseApp = FirebaseApp.Create(
    new AppOptions
    {
        Credential =
            GoogleCredential.GetApplicationDefault()
    });

builder.Services.AddSingleton(firebaseApp);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// RabbitMQ baðlantýsý
builder.Services.AddSingleton<RabbitMqConnection>();
builder.Services.AddHostedService<TaskAssignedConsumer>();
builder.Services.AddHostedService<TaskCommentAddedConsumer>();
builder.Services.AddHostedService<TaskStatusChangedConsumer>();
builder.Services.AddHostedService<TeamMemberAddedConsumer>();
builder.Services.AddSingleton<IFirebaseNotificationService,FirebaseNotificationService>();
builder.Services.AddSingleton<IDeviceTokenProvider,DeviceTokenProvider>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();