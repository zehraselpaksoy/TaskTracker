using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskTracker.Application.DTOs.Tasks;
using TaskTracker.Application.Interfaces.Services;

namespace TaskTracker.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/tasks")]
    public class TaskController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public TaskController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] CreateTaskDto createTaskDto)
        {
            var currentUserId = GetCurrentUserId();

            await _taskService.CreateTaskAsync(
                createTaskDto,
                currentUserId);

            return Ok("Görev başarıyla oluşturuldu.");
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromBody] UpdateTaskDto updateTaskDto)
        {
            var currentUserId = GetCurrentUserId();

            await _taskService.UpdateTaskAsync(
                id,
                updateTaskDto,
                currentUserId);

            return Ok("Görev başarıyla güncellendi.");
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(
            int id,
            [FromBody] UpdateTaskStatusDto updateTaskStatusDto)
        {
            var currentUserId = GetCurrentUserId();

            await _taskService.UpdateTaskStatusAsync(
                id,
                updateTaskStatusDto,
                currentUserId);

            return Ok("Görev durumu başarıyla güncellendi.");
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var currentUserId = GetCurrentUserId();

            await _taskService.DeleteTaskAsync(
                id,
                currentUserId);

            return Ok("Görev başarıyla silindi.");
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var currentUserId = GetCurrentUserId();

            var task = await _taskService.GetTaskByIdAsync(
                id,
                currentUserId);

            if (task == null)
            {
                return NotFound("Görev bulunamadı.");
            }

            return Ok(task);
        }

        [HttpGet("created")]
        public async Task<IActionResult> GetCreatedTasks()
        {
            var currentUserId = GetCurrentUserId();

            var tasks = await _taskService
                .GetCreatedTasksAsync(currentUserId);

            return Ok(tasks);
        }

        [HttpGet("assigned")]
        public async Task<IActionResult> GetAssignedTasks()
        {
            var currentUserId = GetCurrentUserId();

            var tasks = await _taskService
                .GetAssignedTasksAsync(currentUserId);

            return Ok(tasks);
        }
        [HttpGet("team/{teamId}")]
        public async Task<IActionResult> GetTeamTasks(int teamId)
        {
            var currentUserId = GetCurrentUserId();

            var tasks = await _taskService
                .GetTeamTasksAsync(
                    teamId,
                    currentUserId);

            return Ok(tasks);
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User
                .FindFirst(ClaimTypes.NameIdentifier)?
                .Value;

            if (string.IsNullOrWhiteSpace(userIdClaim) ||
                !int.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException(
                    "Kullanıcı kimliği token içerisinden okunamadı.");
            }

            return userId;
        }
    }
}