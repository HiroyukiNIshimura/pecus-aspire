using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddDashboardStatisticsIndexes2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_OrganizationId_CompletedAt",
                table: "WorkspaceTasks",
                columns: new[] { "OrganizationId", "CompletedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_OrganizationId_CreatedAt",
                table: "WorkspaceTasks",
                columns: new[] { "OrganizationId", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_OrganizationId_IsCompleted_IsDiscarded",
                table: "WorkspaceTasks",
                columns: new[] { "OrganizationId", "IsCompleted", "IsDiscarded" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WorkspaceTasks_OrganizationId_CompletedAt",
                table: "WorkspaceTasks");

            migrationBuilder.DropIndex(
                name: "IX_WorkspaceTasks_OrganizationId_CreatedAt",
                table: "WorkspaceTasks");

            migrationBuilder.DropIndex(
                name: "IX_WorkspaceTasks_OrganizationId_IsCompleted_IsDiscarded",
                table: "WorkspaceTasks");
        }
    }
}
