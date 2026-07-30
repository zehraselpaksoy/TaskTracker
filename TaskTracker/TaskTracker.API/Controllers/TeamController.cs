using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskTracker.Application.DTOs.Teams;
using TaskTracker.Application.Interfaces.Services;

namespace TaskTracker.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/teams")]
    public class TeamController : ControllerBase
    {
        private readonly ITeamService _teamService;
        public TeamController(ITeamService teamService)
        {
            _teamService = teamService;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrWhiteSpace(userIdClaim) ||
                !int.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException(
                    "Kullanıcı kimliği token içerisinden okunamadı.");
            }

            return userId;
        }
        [HttpPost]
        public async Task<IActionResult> Create(CreateTeamDto createTeamDto)
        {
            var currentUserId = GetCurrentUserId();

            var createdTeam =
                await _teamService.CreateTeamAsync(
                    createTeamDto,
                    currentUserId);

            return Ok(createdTeam);
        }
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var teams = await _teamService.GetAllTeamsAsync();
            return Ok(teams);
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var currentUserId = GetCurrentUserId();

            var team = await _teamService.GetTeamByIdAsync(
                id,
                currentUserId);

            if (team == null)
            {
                return NotFound("Takım bulunamadı.");
            }

            return Ok(team);
        }
       
        [HttpDelete("{teamId}/members/{userId}")]
        public async Task<IActionResult> RemoveMember(
            int teamId,
            int userId)
        {
            var currentUserId = GetCurrentUserId();

            await _teamService.RemoveMemberAsync(
                teamId,
                userId,
                currentUserId);

            return Ok("Üye takımdan çıkarıldı.");
        }
        [HttpGet("{teamId}/members")]
        public async Task<IActionResult> GetMembers(int teamId)
        {
            var currentUserId = GetCurrentUserId();

            var members = await _teamService
                .GetTeamMembersAsync(
                    teamId,
                    currentUserId);

            return Ok(members);
        }
        [HttpGet("my")]
        public async Task<IActionResult> GetMyTeams()
        {
            var currentUserId = GetCurrentUserId();

            var teams = await _teamService
                .GetMyTeamsAsync(currentUserId);

            return Ok(teams);
        }
    }
}
