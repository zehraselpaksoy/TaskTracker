using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskTracker.Application.DTOs.Teams;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Application.Interfaces.Services;
using TaskTracker.Domain.Entities;
using TaskTracker.Domain.Enums;
using TaskTracker.Application.Interfaces.Messaging;
using TaskTracker.Contracts.Events;

namespace TaskTracker.Application.Services
{
    public class TeamService : ITeamService 
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IActivityService _activityService;
        private readonly IRabbitMqPublisher _rabbitMqPublisher;

        public TeamService(
            IUnitOfWork unitOfWork,
            IActivityService activityService,
            IRabbitMqPublisher rabbitMqPublisher)
        {
            _unitOfWork = unitOfWork;
            _activityService = activityService;
            _rabbitMqPublisher = rabbitMqPublisher;
        }
        public async Task<CreateTeamDto> CreateTeamAsync(CreateTeamDto createTeamDto, int currentUserId)
        {
            var user = await _unitOfWork.Users
                .GetByIdAsync(currentUserId);

            if (user == null)
            {
                throw new Exception("Kullanıcı bulunamadı.");
            }

            if (string.IsNullOrWhiteSpace(createTeamDto.Name))
            {
                throw new Exception("Takım adı boş olamaz.");
            }

            var existingTeam = await _unitOfWork.Teams
                .GetByNameAsync(createTeamDto.Name.Trim());

            if (existingTeam != null)
            {
                throw new Exception("Bu isimde bir takım zaten mevcut.");
            }

            var team = new Team
            {
                Name = createTeamDto.Name.Trim()
            };

            _unitOfWork.Teams.Add(team);

            await _unitOfWork.SaveChangesAsync();

            var leaderMembership = new TeamMember
            {
                TeamId = team.Id,
                UserId = currentUserId,
                Role = TeamRole.Leader
            };

            _unitOfWork.TeamMembers.Add(leaderMembership);

            await _unitOfWork.SaveChangesAsync();

            await _activityService.LogAsync(
                teamId: team.Id,
                userId: currentUserId,
                taskId: null,
                type: ActivityType.TeamCreated,
                description: $"\"{team.Name}\" takımı oluşturuldu."
            );

            return new CreateTeamDto
            {
                Id = team.Id,
                Name = team.Name
            };
            }
        public async Task<TeamDetailDto?> GetTeamByIdAsync(int teamId,int currentUserId)
        {
            var isMember = await _unitOfWork.TeamMembers
                .IsTeamMemberAsync(teamId, currentUserId);

            if (!isMember)
            {
                throw new UnauthorizedAccessException(
                    "Bu takımın detaylarını görüntüleme yetkiniz yok.");
            }

            var team = await _unitOfWork.Teams
                .GetByIdWithDetailsAsync(teamId);

            if (team == null)
            {
                return null;
            }

            var leader = team.Members
                .FirstOrDefault(member =>
                    member.Role == TeamRole.Leader);

            return new TeamDetailDto
            {
                Id = team.Id,

                Name = team.Name,

                LeaderName = leader == null
                    ? string.Empty
                    : $"{leader.User.FirstName} {leader.User.LastName}",

                MemberCount = team.Members.Count,

                CreatedAt = team.CreatedAt,

                Members = team.Members
                    .Select(member => new TeamMemberDto
                    {
                        UserId = member.UserId,

                        FullName =
                            $"{member.User.FirstName} {member.User.LastName}",

                        Email = member.User.Email,

                        Role = member.Role
                    })
                    .OrderBy(member =>
                        member.Role == TeamRole.Leader ? 0 : 1)
                    .ThenBy(member => member.FullName)
                    .ToList()
            };
        }

        public async Task<List<TeamDto>> GetAllTeamsAsync()
        {
            var teams = await _unitOfWork.Teams
                .GetAllWithDetailsAsync();

            return teams.Select(team =>
            {
                var leader = team.Members
                    .FirstOrDefault(m => m.Role == TeamRole.Leader);

                return new TeamDto
                {
                    Id = team.Id,
                    Name = team.Name,

                    LeaderName = leader == null
                        ? string.Empty
                        : $"{leader.User.FirstName} {leader.User.LastName}",

                    MemberCount = team.Members.Count,

                    CreatedAt = team.CreatedAt
                };
            }).ToList();
        }
        
        public async Task RemoveMemberAsync(
     int teamId,
     int userId,
     int currentUserId)
        {
            var team = await _unitOfWork.Teams
                .GetByIdAsync(teamId);

            if (team == null)
            {
                throw new Exception("Takım bulunamadı.");
            }

            var user = await _unitOfWork.Users
                .GetByIdAsync(userId);

            if (user == null)
            {
                throw new Exception("Kullanıcı bulunamadı.");
            }

            var isLeader = await _unitOfWork.TeamMembers
                .IsTeamLeaderAsync(teamId, currentUserId);

            if (!isLeader)
            {
                throw new UnauthorizedAccessException(
                    "Takımdan yalnızca takım lideri üye çıkarabilir.");
            }

            if (userId == currentUserId)
            {
                throw new Exception(
                    "Takım lideri kendisini takımdan çıkaramaz.");
            }

            var teamMember = await _unitOfWork.TeamMembers
                .GetTeamMemberAsync(teamId, userId);

            if (teamMember == null)
            {
                throw new Exception(
                    "Bu kullanıcı takımın üyesi değildir.");
            }

            _unitOfWork.TeamMembers.Delete(teamMember);

            await _unitOfWork.SaveChangesAsync();

            await _activityService.LogAsync(
                teamId: teamId,
                userId: currentUserId,
                taskId: null,
                type: ActivityType.MemberRemoved,
                description:
                    $"\"{user.FirstName} {user.LastName}\" takımdan çıkarıldı."
            );
        }
        public async Task<List<TeamMemberDto>> GetTeamMembersAsync(
            int teamId,
            int currentUserId)
        {
            var isMember = await _unitOfWork.TeamMembers
                .IsTeamMemberAsync(teamId, currentUserId);

            if (!isMember)
            {
                throw new UnauthorizedAccessException(
                    "Bu takımın üyelerini görüntüleme yetkiniz yok.");
            }

            var team = await _unitOfWork.Teams
                .GetByIdWithDetailsAsync(teamId);

            if (team == null)
            {
                throw new Exception("Takım bulunamadı.");
            }

            return team.Members
                .Select(member => new TeamMemberDto
                {
                    UserId = member.UserId,

                    FullName =
                        $"{member.User.FirstName} {member.User.LastName}",

                    Email = member.User.Email,

                    Role = member.Role
                })
                .ToList();
        }
        public async Task<List<TeamDto>> GetMyTeamsAsync(int currentUserId)
        {
            var teams = await _unitOfWork.TeamMembers
                .GetTeamsByUserIdAsync(currentUserId);

            return teams.Select(team =>
            {
                var leader = team.Members
                    .FirstOrDefault(member =>
                        member.Role == TeamRole.Leader);

                return new TeamDto
                {
                    Id = team.Id,
                    Name = team.Name,

                    LeaderName = leader == null
                        ? string.Empty
                        : $"{leader.User.FirstName} {leader.User.LastName}",

                    MemberCount = team.Members.Count,
                    CreatedAt = team.CreatedAt
                };
            }).ToList();
        }
    }
}
