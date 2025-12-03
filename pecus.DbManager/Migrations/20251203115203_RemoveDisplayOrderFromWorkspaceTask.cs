using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class RemoveDisplayOrderFromWorkspaceTask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WorkspaceTasks_DisplayOrder",
                table: "WorkspaceTasks");

            migrationBuilder.DropColumn(
                name: "DisplayOrder",
                table: "WorkspaceTasks");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DisplayOrder",
                table: "WorkspaceTasks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_DisplayOrder",
                table: "WorkspaceTasks",
                column: "DisplayOrder");
        }
    }
}
