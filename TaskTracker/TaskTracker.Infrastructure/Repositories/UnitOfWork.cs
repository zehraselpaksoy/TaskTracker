using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Infrastructure.Context;

namespace TaskTracker.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly TaskTrackerDbContext _context;

        public IUserRepository Users { get; }

        public ITaskItemRepository Tasks { get; }

        public ICategoryRepository Categories { get; }

        public ITeamRepository Teams { get; }

        public ITeamMemberRepository TeamMembers { get; }

        public UnitOfWork(
            TaskTrackerDbContext context,
            IUserRepository userRepository,
            ITaskItemRepository taskItemRepository,
            ICategoryRepository categoryRepository,
            ITeamRepository teamRepository,
            ITeamMemberRepository teamMemberRepository)
        {
            _context = context;

            Users = userRepository;
            Tasks = taskItemRepository;
            Categories = categoryRepository;
            Teams = teamRepository;
            TeamMembers = teamMemberRepository;
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}