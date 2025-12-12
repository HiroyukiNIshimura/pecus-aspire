using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddPredecessorTaskToWorkspaceTask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PredecessorTaskId",
                table: "WorkspaceTasks",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_PredecessorTaskId",
                table: "WorkspaceTasks",
                column: "PredecessorTaskId");

            migrationBuilder.AddCheckConstraint(
                name: "CK_WorkspaceTask_NoSelfReference",
                table: "WorkspaceTasks",
                sql: "\"PredecessorTaskId\" IS NULL OR \"PredecessorTaskId\" != \"Id\"");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkspaceTasks_WorkspaceTasks_PredecessorTaskId",
                table: "WorkspaceTasks",
                column: "PredecessorTaskId",
                principalTable: "WorkspaceTasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkspaceTasks_WorkspaceTasks_PredecessorTaskId",
                table: "WorkspaceTasks");

            migrationBuilder.DropIndex(
                name: "IX_WorkspaceTasks_PredecessorTaskId",
                table: "WorkspaceTasks");

            migrationBuilder.DropCheckConstraint(
                name: "CK_WorkspaceTask_NoSelfReference",
                table: "WorkspaceTasks");

            migrationBuilder.DropColumn(
                name: "PredecessorTaskId",
                table: "WorkspaceTasks");
        }
    }
}
