using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkspaceTaskIdToWorkspaceItemAttachment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "WorkspaceTaskId",
                table: "WorkspaceItemAttachments",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceItemAttachments_WorkspaceTaskId",
                table: "WorkspaceItemAttachments",
                column: "WorkspaceTaskId");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkspaceItemAttachments_WorkspaceTasks_WorkspaceTaskId",
                table: "WorkspaceItemAttachments",
                column: "WorkspaceTaskId",
                principalTable: "WorkspaceTasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkspaceItemAttachments_WorkspaceTasks_WorkspaceTaskId",
                table: "WorkspaceItemAttachments");

            migrationBuilder.DropIndex(
                name: "IX_WorkspaceItemAttachments_WorkspaceTaskId",
                table: "WorkspaceItemAttachments");

            migrationBuilder.DropColumn(
                name: "WorkspaceTaskId",
                table: "WorkspaceItemAttachments");
        }
    }
}
