using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Infrastructure.Context;

namespace TaskTracker.Infrastructure.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly TaskTrackerDbContext _context;

    public IUserDeviceTokenRepository UserDeviceTokens { get; }
    public IUserRepository Users { get; }

    public ITaskItemRepository Tasks { get; }

    public ICategoryRepository Categories { get; }

    public ITeamRepository Teams { get; }

    public ITeamMemberRepository TeamMembers { get; }

    public ITaskCommentRepository TaskComments { get; }

    public ICommentAttachmentRepository CommentAttachments { get; }
    public IActivityRepository Activities { get; }

    public UnitOfWork(
        TaskTrackerDbContext context,
        IUserRepository userRepository,
        ITaskItemRepository taskItemRepository,
        ICategoryRepository categoryRepository,
        ITeamRepository teamRepository,
        ITeamMemberRepository teamMemberRepository,
        ITaskCommentRepository taskCommentRepository,
        ICommentAttachmentRepository commentAttachmentRepository,
        IActivityRepository activities,
        IUserDeviceTokenRepository userDeviceTokens )
    {
        _context = context;

        Users = userRepository;
        Tasks = taskItemRepository;
        Categories = categoryRepository;
        Teams = teamRepository;
        TeamMembers = teamMemberRepository;
        TaskComments = taskCommentRepository;
        CommentAttachments = commentAttachmentRepository;
        Activities = activities;
        UserDeviceTokens = userDeviceTokens;
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