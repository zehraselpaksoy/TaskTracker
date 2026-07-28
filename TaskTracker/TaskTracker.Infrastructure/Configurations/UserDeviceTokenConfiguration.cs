using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskTracker.Domain.Entities;

namespace TaskTracker.Infrastructure.Configurations;

public sealed class UserDeviceTokenConfiguration
    : IEntityTypeConfiguration<UserDeviceToken>
{
    public void Configure(
        EntityTypeBuilder<UserDeviceToken> builder)
    {
        builder.ToTable("UserDeviceTokens");

        builder.HasKey(deviceToken => deviceToken.Id);

        builder.Property(deviceToken => deviceToken.Token)
            .IsRequired()
            .HasMaxLength(2048);

        builder.Property(deviceToken => deviceToken.Platform)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(deviceToken => deviceToken.Token)
            .IsUnique();

        builder.HasOne(deviceToken => deviceToken.User)
            .WithMany(user => user.DeviceTokens)
            .HasForeignKey(deviceToken => deviceToken.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}