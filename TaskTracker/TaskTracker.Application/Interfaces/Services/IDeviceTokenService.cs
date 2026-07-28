using TaskTracker.Application.DTOs.Notifications;

namespace TaskTracker.Application.Interfaces.Services;

public interface IDeviceTokenService
{
    Task RegisterAsync(
        int userId,
        RegisterDeviceTokenDto registerDeviceTokenDto);
}