namespace TaskTracker.Application.Interfaces.Services
{
    public interface IPasswordHasher
    {
        string HashPassword(string password);

        bool VerifyPassword(string hashedPassword, string password);
    }
}