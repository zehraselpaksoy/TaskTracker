using TaskTracker.Domain.Entities;

namespace TaskTracker.Application.Interfaces.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user);
    }
}