using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskTracker.Infrastructure.Context;

namespace TaskTracker.API.Controllers
{
    [ApiController]
    [Route("api/categories")]
    public class CategoriesController : ControllerBase
    {
        private readonly TaskTrackerDbContext _context;

        public CategoriesController(TaskTrackerDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllCategories()
        {
            var categories = await _context.Categories
                .AsNoTracking()
                .OrderBy(category => category.Name)
                .Select(category => new
                {
                    id = category.Id,
                    name = category.Name
                })
                .ToListAsync();

            return Ok(categories);
        }
    }
}