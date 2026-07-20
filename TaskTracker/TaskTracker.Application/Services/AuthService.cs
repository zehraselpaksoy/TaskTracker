using TaskTracker.Application.DTOs.Auth;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Application.Interfaces.Services;
using TaskTracker.Domain.Entities;

namespace TaskTracker.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IPasswordHasher _passwordHasher;
        private readonly IJwtService _jwtService;

        public AuthService(
            IUnitOfWork unitOfWork,
            IPasswordHasher passwordHasher,
            IJwtService jwtService)
        {
            _unitOfWork = unitOfWork;
            _passwordHasher = passwordHasher;
            _jwtService = jwtService;
        }

        public async Task RegisterAsync(RegisterDto registerDto)
        {
            var existingUser = await _unitOfWork.Users.GetByEmailAsync(registerDto.Email);

            if (existingUser != null)
            {
                throw new Exception("Bu e-posta adresi zaten kayıtlı.");
            }
            var hashedPassword =  _passwordHasher.HashPassword(registerDto.Password);
            
            var user = new User
            {
                FirstName = registerDto.FirstName,  
                LastName = registerDto.LastName,
                Email = registerDto.Email,
                PasswordHash = hashedPassword
            };

            _unitOfWork.Users.Add(user);

            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<string> LoginAsync(LoginDto loginDto)
        {
            var user = await _unitOfWork.Users.GetByEmailAsync(loginDto.Email);
            if (user == null)
            {
                throw new Exception("Email veya şifre hatalı.");
            }
            var isPasswordValid = _passwordHasher.VerifyPassword(user.PasswordHash, loginDto.Password);

            if (!isPasswordValid)
            {
                throw new Exception("Email veya şifre hatalı.");
            }
            return _jwtService.GenerateToken(user);
        }
    }
}