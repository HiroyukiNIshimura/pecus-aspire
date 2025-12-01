using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkspaceItemUpdatedByUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UpdatedByUserId",
                table: "WorkspaceItems",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceItems_UpdatedByUserId",
                table: "WorkspaceItems",
                column: "UpdatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkspaceItems_Users_UpdatedByUserId",
                table: "WorkspaceItems",
                column: "UpdatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkspaceItems_Users_UpdatedByUserId",
                table: "WorkspaceItems");

            migrationBuilder.DropIndex(
                name: "IX_WorkspaceItems_UpdatedByUserId",
                table: "WorkspaceItems");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "WorkspaceItems");
        }
    }
}
