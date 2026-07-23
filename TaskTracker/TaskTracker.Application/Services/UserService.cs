using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskTracker.Application.Interfaces.Repositories;
using TaskTracker.Application.Interfaces.Services;
using TaskTracker.Application.DTOs.Users;

namespace TaskTracker.Application.Services
{
    public class UserService : IUserService
    {
        private readonly IUnitOfWork _unitOfWork;

        public UserService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }
        public async Task<List<UserSearchResultDto>> SearchUsersAsync(string query,int teamId)
        {
            var users = await _unitOfWork.Users
                .SearchUsersAsync(query, teamId);

            return users.Select(user => new UserSearchResultDto
            {
                Id = user.Id,
                FullName = $"{user.FirstName} {user.LastName}",
                Email = user.Email
            }).ToList();
        }
    }
}
