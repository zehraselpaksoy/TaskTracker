namespace TaskTracker.Application.DTOs.Notifications;

public sealed class RegisterDeviceTokenDto
{
    public string Token { get; set; } = string.Empty;

    public string Platform { get; set; } = string.Empty;
}