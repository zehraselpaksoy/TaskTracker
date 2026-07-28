using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskTracker.Domain.Entities;

namespace TaskTracker.Persistence.Configurations;

public class ActivityConfiguration : IEntityTypeConfiguration<Activity>
{
    public void Configure(EntityTypeBuilder<Activity> entity)
    {
        entity.HasKey(x => x.Id);

        entity.Property(x => x.Description)
            .IsRequired()
            .HasMaxLength(500);

        entity.Property(x => x.CreatedAt)
            .IsRequired();

        entity.HasOne(x => x.Team)
            .WithMany()
            .HasForeignKey(x => x.TeamId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        entity.HasOne(x => x.Task)
            .WithMany()
            .HasForeignKey(x => x.TaskId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}