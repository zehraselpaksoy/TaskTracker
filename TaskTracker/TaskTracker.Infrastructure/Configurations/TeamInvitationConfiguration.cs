using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskTracker.Domain.Entities;

namespace TaskTracker.Infrastructure.Configurations;

public sealed class TeamInvitationConfiguration
    : IEntityTypeConfiguration<TeamInvitation>
{
    public void Configure(
        EntityTypeBuilder<TeamInvitation> builder)
    {
        builder.ToTable("TeamInvitations");

        builder.HasKey(invitation => invitation.Id);

        builder.Property(invitation => invitation.Email)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(invitation => invitation.TokenHash)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(invitation => invitation.Status)
            .IsRequired();

        builder.Property(invitation => invitation.ExpiresAtUtc)
            .IsRequired();

        builder.HasIndex(invitation => invitation.TokenHash)
            .IsUnique();

        builder.HasIndex(invitation => new
        {
            invitation.TeamId,
            invitation.Email,
            invitation.Status
        });

        builder.HasOne(invitation => invitation.Team)
            .WithMany(team => team.Invitations)
            .HasForeignKey(invitation => invitation.TeamId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(invitation =>
                invitation.InvitedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<User>()
            .WithMany()
            .HasForeignKey(invitation =>
                invitation.InvitedUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}