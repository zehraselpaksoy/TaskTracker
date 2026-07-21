using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskTracker.Domain.Entities;

namespace TaskTracker.Infrastructure.Configurations
{
    public class TaskCommentConfiguration
        : IEntityTypeConfiguration<TaskComment>
    {
        public void Configure(
            EntityTypeBuilder<TaskComment> builder)
        {
            builder.ToTable("TaskComments");

            builder.HasKey(comment => comment.Id);

            builder.Property(comment => comment.Content)
                .IsRequired()
                .HasMaxLength(3000);

            builder.HasOne(comment => comment.TaskItem)
                .WithMany(task => task.Comments)
                .HasForeignKey(comment => comment.TaskItemId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(comment => comment.User)
                .WithMany(user => user.Comments)
                .HasForeignKey(comment => comment.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(comment => comment.TaskItemId);

            builder.HasIndex(comment => comment.UserId);
        }
    }
}