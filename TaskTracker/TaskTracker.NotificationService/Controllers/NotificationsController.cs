using Microsoft.AspNetCore.Mvc;
using TaskTracker.NotificationService.Services;

namespace TaskTracker.NotificationService.Controllers;

[ApiController]
[Route("api/notifications")]
public sealed class NotificationsController : ControllerBase
{
    private readonly IFirebaseNotificationService
        _firebaseNotificationService;

    private readonly IWebHostEnvironment _environment;

    public NotificationsController(
        IFirebaseNotificationService firebaseNotificationService,
        IWebHostEnvironment environment)
    {
        _firebaseNotificationService =
            firebaseNotificationService;

        _environment = environment;
    }

    [HttpPost("test")]
    public async Task<IActionResult> SendTest(
        [FromBody] SendTestNotificationRequest request,
        CancellationToken cancellationToken)
    {
        if (!_environment.IsDevelopment())
        {
            return NotFound();
        }

        var messageId =
            await _firebaseNotificationService.SendAsync(
                deviceToken: request.DeviceToken,
                title: request.Title,
                body: request.Body,
                data: new Dictionary<string, string>
                {
                    ["type"] = "test"
                },
                cancellationToken: cancellationToken);

        return Ok(new
        {
            message = "Test bildirimi gönderildi.",
            messageId
        });
    }
}

public sealed class SendTestNotificationRequest
{
    public string DeviceToken { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Body { get; set; } = string.Empty;
}