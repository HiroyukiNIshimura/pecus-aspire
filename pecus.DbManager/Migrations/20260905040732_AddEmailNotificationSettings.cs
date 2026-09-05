using Microsoft.EntityFrameworkCore.Migrations;
using System.Collections.Generic;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddEmailNotificationSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CanReceiveWeeklyReport",
                table: "UserSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "CustomEmailSettings",
                table: "UserSettings",
                type: "jsonb",
                nullable: false,
                defaultValue: "{}");

            migrationBuilder.AddColumn<int>(
                name: "EmailNotificationMode",
                table: "UserSettings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<List<int>>(
                name: "EmailWorkspaceIds",
                table: "UserSettings",
                type: "integer[]",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CanReceiveWeeklyReport",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "CustomEmailSettings",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "EmailNotificationMode",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "EmailWorkspaceIds",
                table: "UserSettings");
        }
    }
}