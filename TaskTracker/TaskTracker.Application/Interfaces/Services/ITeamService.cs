using TaskTracker.Application.DTOs.Teams;

namespace TaskTracker.Application.Interfaces.Services
{
    public interface ITeamService
    {
        Task CreateTeamAsync(
            CreateTeamDto createTeamDto,
            int currentUserId);

        Task<TeamDetailDto?> GetTeamByIdAsync(int teamId, int currentUserId);

        Task<List<TeamDto>> GetAllTeamsAsync();
        Task AddMemberAsync(
            int teamId,
            int userId,
            int currentUserId);
        Task RemoveMemberAsync(
            int teamId,
            int userId,
            int currentUserId);
        Task<List<TeamMemberDto>> GetTeamMembersAsync(int teamId,int currentUserId);
        Task<List<TeamDto>> GetMyTeamsAsync(int currentUserId);
        
    }

}