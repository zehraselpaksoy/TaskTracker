using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskTracker.Application.DTOs.Notifications;
using TaskTracker.Application.Interfaces.Services;


namespace TaskTracker.API.Controllers;

[Authorize]
[ApiController]
[Route("api/device-tokens")]
public sealed class DeviceTokensController : ControllerBase
{
    private readonly IDeviceTokenService _deviceTokenService;

    public DeviceTokensController(
        IDeviceTokenService deviceTokenService)
    {
        _deviceTokenService = deviceTokenService;
    }

    [HttpPost]
    public async Task<IActionResult> Register(
        [FromBody] RegisterDeviceTokenDto registerDeviceTokenDto)
    {
        var currentUserId = GetCurrentUserId();

        await _deviceTokenService.RegisterAsync(
            currentUserId,
            registerDeviceTokenDto);

        return Ok(new
        {
            message = "Cihaz tokenı başarıyla kaydedildi."
        });
    }

    private int GetCurrentUserId()
    {
        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdValue, out var userId))
        {
            throw new UnauthorizedAccessException(
                "Kullanıcı kimliği doğrulanamadı.");
        }

        return userId;
    }
}