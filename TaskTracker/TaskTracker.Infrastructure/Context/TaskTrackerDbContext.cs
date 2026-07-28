using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TaskTracker.Domain.Entities;

namespace TaskTracker.Infrastructure.Context
{
    public class TaskTrackerDbContext : DbContext
    {
        public TaskTrackerDbContext(DbContextOptions<TaskTrackerDbContext> options) : base(options)
        {
        }
        public DbSet<TaskComment> TaskComments { get; set; }
        public DbSet<CommentAttachment> CommentAttachments { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<TaskItem> TaskItems { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Team> Teams { get; set; }
        public DbSet<Activity> Activities => Set<Activity>();
        public DbSet<TeamMember> TeamMembers { get; set; }
        public DbSet<UserDeviceToken> UserDeviceTokens { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(TaskTrackerDbContext).Assembly);

            base.OnModelCreating(modelBuilder);
        }
    }
}
