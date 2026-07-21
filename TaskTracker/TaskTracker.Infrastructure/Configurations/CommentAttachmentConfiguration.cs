using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using TaskTracker.Domain.Entities;

namespace TaskTracker.Infrastructure.Configurations
{
    public class CommentAttachmentConfiguration
        : IEntityTypeConfiguration<CommentAttachment>
    {
        public void Configure(
            EntityTypeBuilder<CommentAttachment> builder)
        {
            builder.ToTable("CommentAttachments");

            builder.HasKey(attachment => attachment.Id);

            builder.Property(
                    attachment => attachment.OriginalFileName)
                .IsRequired()
                .HasMaxLength(255);

            builder.Property(x => x.ObjectKey)
                .IsRequired()
                .HasMaxLength(500);
            
            builder.Property(
                    attachment => attachment.ContentType)
                .IsRequired()
                .HasMaxLength(150);

            builder.Property(
                    attachment => attachment.FileSize)
                .IsRequired();

            builder.HasOne(
                    attachment => attachment.TaskComment)
                .WithMany(comment => comment.Attachments)
                .HasForeignKey(
                    attachment => attachment.TaskCommentId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(
                attachment => attachment.TaskCommentId);
        }
    }
}