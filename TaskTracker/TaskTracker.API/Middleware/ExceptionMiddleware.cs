using System.Net;
using System.Text.Json;

namespace TaskTracker.API.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;

        public ExceptionMiddleware(
            RequestDelegate next,
            ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (UnauthorizedAccessException exception)
            {
                _logger.LogWarning(
                    exception,
                    "Yetkisiz erişim denemesi.");

                await WriteResponseAsync(
                    context,
                    HttpStatusCode.Forbidden,   
                    exception.Message);
            }
            catch (KeyNotFoundException exception)
            {
                _logger.LogWarning(
                    exception,
                    "Kayıt bulunamadı.");

                await WriteResponseAsync(
                    context,
                    HttpStatusCode.NotFound,
                    exception.Message);
            }
            catch (ArgumentException exception)
            {
                _logger.LogWarning(
                    exception,
                    "Geçersiz istek.");

                await WriteResponseAsync(
                    context,
                    HttpStatusCode.BadRequest,
                    exception.Message);
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Beklenmeyen bir hata oluştu.");

                await WriteResponseAsync(
                    context,
                    HttpStatusCode.InternalServerError,
                    exception.Message);
            }
        }

        private static async Task WriteResponseAsync(
            HttpContext context,
            HttpStatusCode statusCode,
            string message)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)statusCode;

            var response = new
            {
                statusCode = (int)statusCode,
                message
            };

            var jsonResponse = JsonSerializer.Serialize(response);

            await context.Response.WriteAsync(jsonResponse);
        }
    }
}