using Microsoft.AspNetCore.Identity;
using TaskTracker.Application.Interfaces.Services;

namespace TaskTracker.Infrastructure.Identity
{
    public class PasswordHasher : IPasswordHasher
    {
        private readonly Microsoft.AspNetCore.Identity.PasswordHasher<object> _passwordHasher;

        public PasswordHasher()
        {
            _passwordHasher = new Microsoft.AspNetCore.Identity.PasswordHasher<object>();
        }

        public string HashPassword(string password)
        {
            return _passwordHasher.HashPassword(null!, password);
        }

        public bool VerifyPassword(string hashedPassword, string password)
        {
            var result = _passwordHasher.VerifyHashedPassword(
                null!,
                hashedPassword,
                password);

            return result == PasswordVerificationResult.Success;
        }
    }
}