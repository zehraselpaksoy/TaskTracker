using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskTracker.Application.DTOs.Auth;

namespace TaskTracker.Application.Interfaces.Services
{
    public interface IAuthService
    {
        Task RegisterAsync(RegisterDto registerDto);

        Task<string> LoginAsync(LoginDto loginDto);
    }
}
