using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddCompletedByUserIdToWorkspaceTask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CompletedByUserId",
                table: "WorkspaceTasks",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_CompletedByUserId",
                table: "WorkspaceTasks",
                column: "CompletedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkspaceTasks_Users_CompletedByUserId",
                table: "WorkspaceTasks",
                column: "CompletedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkspaceTasks_Users_CompletedByUserId",
                table: "WorkspaceTasks");

            migrationBuilder.DropIndex(
                name: "IX_WorkspaceTasks_CompletedByUserId",
                table: "WorkspaceTasks");

            migrationBuilder.DropColumn(
                name: "CompletedByUserId",
                table: "WorkspaceTasks");
        }
    }
}
