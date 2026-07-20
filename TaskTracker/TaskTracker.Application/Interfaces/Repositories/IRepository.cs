using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskTracker.Domain.Common;

namespace TaskTracker.Application.Interfaces.Repositories
{
    public interface IRepository<T> where T : BaseEntity
    {
        void Add(T entity);
        void Delete(T entity);
        void Update(T entity);
        Task<T?> GetByIdAsync(int id);
        Task<List<T>> GetAllAsync();
    }
}
