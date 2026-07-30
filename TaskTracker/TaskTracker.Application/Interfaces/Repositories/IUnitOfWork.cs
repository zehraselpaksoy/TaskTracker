using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TaskTracker.Application.Interfaces.Repositories
{
    public interface IUnitOfWork : IDisposable
    {
        IUserRepository Users { get; }

        ITaskItemRepository Tasks { get; }

        ICategoryRepository Categories { get; }

        Task<int> SaveChangesAsync();
        ITeamRepository Teams { get; }

        ITeamMemberRepository TeamMembers { get; }
        ITaskCommentRepository TaskComments { get; }
        ICommentAttachmentRepository CommentAttachments { get; }
        IActivityRepository Activities { get; }
        ITeamInvitationRepository TeamInvitations { get; }
        IUserDeviceTokenRepository UserDeviceTokens { get; }


    }
}
