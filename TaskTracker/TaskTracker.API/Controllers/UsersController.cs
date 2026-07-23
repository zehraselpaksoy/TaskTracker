using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskTracker.Application.Interfaces.Services;

namespace TaskTracker.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/users")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search(
            [FromQuery] string query,
            [FromQuery] int teamId)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest("Arama metni boş olamaz.");
            }

            var users = await _userService.SearchUsersAsync(
                query,
                teamId);

            return Ok(users);
        }
    }
}