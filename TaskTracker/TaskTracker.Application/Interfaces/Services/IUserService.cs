using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskTracker.Application.DTOs.Users;

namespace TaskTracker.Application.Interfaces.Services
{
    public interface IUserService
    {
        Task<List<UserSearchResultDto>> SearchUsersAsync(string query,int teamId);
    }
}
