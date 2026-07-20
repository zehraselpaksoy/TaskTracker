using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TaskTracker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskAssignmentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskItems_Categories_CategoryId",
                table: "TaskItems");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskItems_Users_UserId",
                table: "TaskItems");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "TaskItems",
                newName: "CreatedByUserId");

            migrationBuilder.RenameIndex(
                name: "IX_TaskItems_UserId",
                table: "TaskItems",
                newName: "IX_TaskItems_CreatedByUserId");

            migrationBuilder.AlterColumn<DateTime>(
                name: "StartDate",
                table: "TaskItems",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "TaskItems",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000);

            migrationBuilder.AddColumn<int>(
                name: "AssignedToUserId",
                table: "TaskItems",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskItems_AssignedToUserId",
                table: "TaskItems",
                column: "AssignedToUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_TaskItems_Categories_CategoryId",
                table: "TaskItems",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskItems_Users_AssignedToUserId",
                table: "TaskItems",
                column: "AssignedToUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskItems_Users_CreatedByUserId",
                table: "TaskItems",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TaskItems_Categories_CategoryId",
                table: "TaskItems");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskItems_Users_AssignedToUserId",
                table: "TaskItems");

            migrationBuilder.DropForeignKey(
                name: "FK_TaskItems_Users_CreatedByUserId",
                table: "TaskItems");

            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_TaskItems_AssignedToUserId",
                table: "TaskItems");

            migrationBuilder.DropColumn(
                name: "AssignedToUserId",
                table: "TaskItems");

            migrationBuilder.RenameColumn(
                name: "CreatedByUserId",
                table: "TaskItems",
                newName: "UserId");

            migrationBuilder.RenameIndex(
                name: "IX_TaskItems_CreatedByUserId",
                table: "TaskItems",
                newName: "IX_TaskItems_UserId");

            migrationBuilder.AlterColumn<DateTime>(
                name: "StartDate",
                table: "TaskItems",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "TaskItems",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskItems_Categories_CategoryId",
                table: "TaskItems",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TaskItems_Users_UserId",
                table: "TaskItems",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
