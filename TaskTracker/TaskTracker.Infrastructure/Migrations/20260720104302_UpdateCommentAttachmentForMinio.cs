using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCommentAttachmentForMinio : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "CommentAttachments");

            migrationBuilder.DropColumn(
                name: "StoredFileName",
                table: "CommentAttachments");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "CommentAttachments");

            migrationBuilder.RenameColumn(
                name: "StoragePath",
                table: "CommentAttachments",
                newName: "ObjectKey");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ObjectKey",
                table: "CommentAttachments",
                newName: "StoragePath");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "CommentAttachments",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "StoredFileName",
                table: "CommentAttachments",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "CommentAttachments",
                type: "datetime2",
                nullable: true);
        }
    }
}
