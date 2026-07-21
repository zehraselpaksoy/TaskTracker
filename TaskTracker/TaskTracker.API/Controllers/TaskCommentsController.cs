using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TaskTracker.Application.DTOs.Comments;
using TaskTracker.Application.Interfaces.Services;

namespace TaskTracker.API.Controllers
{
    [ApiController]
    [Route("api")]
    [Authorize]
    public class TaskCommentsController : ControllerBase
    {
        private readonly ITaskCommentService _taskCommentService;

        public TaskCommentsController(
            ITaskCommentService taskCommentService)
        {
            _taskCommentService = taskCommentService;
        }

        [HttpGet("tasks/{taskId:int}/comments")]
        public async Task<IActionResult> GetCommentsByTaskId(
            int taskId)
        {
            var currentUserId = GetCurrentUserId();

            var comments = await _taskCommentService
                .GetCommentsByTaskIdAsync(
                    taskId,
                    currentUserId);

            return Ok(comments);
        }

        [HttpGet("comments/{commentId:int}")]
        public async Task<IActionResult> GetCommentById(
            int commentId)
        {
            var currentUserId = GetCurrentUserId();

            var comment = await _taskCommentService
                .GetCommentByIdAsync(
                    commentId,
                    currentUserId);

            if (comment == null)
            {
                return NotFound(
                    new { message = "Yorum bulunamadı." });
            }

            return Ok(comment);
        }

        [HttpPost("tasks/{taskId:int}/comments")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateComment(
            int taskId,
            [FromForm] CreateCommentDto createCommentDto)
        {
            var currentUserId = GetCurrentUserId();

            var comment = await _taskCommentService
                .CreateCommentAsync(
                    taskId,
                    createCommentDto,
                    currentUserId);

            return CreatedAtAction(
                nameof(GetCommentById),
                new { commentId = comment.Id },
                comment);
        }

        [HttpPut("comments/{commentId:int}")]
        public async Task<IActionResult> UpdateComment(
            int commentId,
            [FromBody] UpdateCommentDto updateCommentDto)
        {
            var currentUserId = GetCurrentUserId();

            var comment = await _taskCommentService
                .UpdateCommentAsync(
                    commentId,
                    updateCommentDto,
                    currentUserId);

            return Ok(comment);
        }

        [HttpDelete("comments/{commentId:int}")]
        public async Task<IActionResult> DeleteComment(
            int commentId)
        {
            var currentUserId = GetCurrentUserId();

            await _taskCommentService
                .DeleteCommentAsync(
                    commentId,
                    currentUserId);

            return NoContent();
        }

        private int GetCurrentUserId()
        {
            var userIdValue = User.FindFirstValue(
                ClaimTypes.NameIdentifier);

            if (!int.TryParse(userIdValue, out var userId))
            {
                throw new UnauthorizedAccessException(
                    "Kullanıcı kimliği doğrulanamadı.");
            }

            return userId;
        }

        [HttpDelete("attachments/{attachmentId:int}")]
        public async Task<IActionResult> DeleteAttachment(int attachmentId)
        {
            var userId = int.Parse(
                User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

            await _taskCommentService.DeleteAttachmentAsync(
                attachmentId,
                userId);

            return NoContent();
        }
    }
}