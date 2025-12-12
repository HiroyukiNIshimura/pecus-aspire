using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizationSettingTaskConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EnforcePredecessorCompletion",
                table: "OrganizationSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "RequireEstimateOnTaskCreation",
                table: "OrganizationSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EnforcePredecessorCompletion",
                table: "OrganizationSettings");

            migrationBuilder.DropColumn(
                name: "RequireEstimateOnTaskCreation",
                table: "OrganizationSettings");
        }
    }
}