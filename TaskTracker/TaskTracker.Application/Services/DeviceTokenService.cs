using TaskTracker.Application.DTOs.Notifications;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Application.Interfaces.Services;
using TaskTracker.Domain.Entities;

namespace TaskTracker.Application.Services;

public sealed class DeviceTokenService : IDeviceTokenService
{
    private readonly IUnitOfWork _unitOfWork;

    public DeviceTokenService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task RegisterAsync(
        int userId,
        RegisterDeviceTokenDto registerDeviceTokenDto)
    {
        if (string.IsNullOrWhiteSpace(
                registerDeviceTokenDto.Token))
        {
            throw new ArgumentException(
                "Cihaz tokenı boş olamaz.");
        }

        if (string.IsNullOrWhiteSpace(
                registerDeviceTokenDto.Platform))
        {
            throw new ArgumentException(
                "Cihaz platformu boş olamaz.");
        }

        var user = await _unitOfWork.Users
            .GetByIdAsync(userId);

        if (user is null)
        {
            throw new Exception("Kullanıcı bulunamadı.");
        }

        var token = registerDeviceTokenDto.Token.Trim();

        var platform = registerDeviceTokenDto.Platform
            .Trim()
            .ToLowerInvariant();

        if (platform is not "android" and not "ios")
        {
            throw new ArgumentException(
                "Desteklenmeyen cihaz platformu.");
        }

        var existingDeviceToken =
            await _unitOfWork.UserDeviceTokens
                .GetByTokenAsync(token);

        if (existingDeviceToken is not null)
        {
            if (existingDeviceToken.UserId == userId &&
                existingDeviceToken.Platform == platform)
            {
                return;
            }

            existingDeviceToken.UserId = userId;
            existingDeviceToken.Platform = platform;
            existingDeviceToken.UpdatedAt = DateTime.UtcNow;

            _unitOfWork.UserDeviceTokens.Update(
                existingDeviceToken);

            await _unitOfWork.SaveChangesAsync();

            return;
        }

        var userDeviceToken = new UserDeviceToken
        {
            UserId = userId,
            Token = token,
            Platform = platform
        };

        _unitOfWork.UserDeviceTokens.Add(userDeviceToken);

        await _unitOfWork.SaveChangesAsync();
    }
}