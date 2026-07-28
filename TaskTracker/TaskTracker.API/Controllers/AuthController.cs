using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskTracker.Application.DTOs.Auth;
using TaskTracker.Application.Interfaces.Services;

namespace TaskTracker.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto registerDto)
        {
            await _authService.RegisterAsync(registerDto);

            return Ok("Kullanıcı başarıyla oluşturuldu.");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto loginDto)
        {
            var token = await _authService.LoginAsync(loginDto);

            return Ok(new
            {
                token
            });
        }

        [Authorize]
        [HttpGet("profile")]
        public IActionResult Profile()
        {
            return Ok("Bu alana sadece giriş yapan kullanıcı erişebilir.");
        }
    }
}