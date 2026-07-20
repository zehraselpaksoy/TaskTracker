using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskTracker.Domain.Common;

namespace TaskTracker.Domain.Entities
{
    public class Category : BaseEntity  
    {
        public required string Name { get; set; }
        public ICollection<TaskItem> TaskItems { get; set; } = new List<TaskItem>();    
    }
}
