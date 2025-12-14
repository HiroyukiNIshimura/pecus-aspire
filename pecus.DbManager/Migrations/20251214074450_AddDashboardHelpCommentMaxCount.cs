using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddDashboardHelpCommentMaxCount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DashboardHelpCommentMaxCount",
                table: "OrganizationSettings",
                type: "integer",
                nullable: false,
                defaultValue: 6);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DashboardHelpCommentMaxCount",
                table: "OrganizationSettings");
        }
    }
}
