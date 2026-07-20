using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskTracker.Domain.Entities;

namespace TaskTracker.Application.Interfaces.Repositories
{
    public interface IUserRepository : IRepository<User>  
    {
        Task<User?> GetByEmailAsync(string email);
    }
}
