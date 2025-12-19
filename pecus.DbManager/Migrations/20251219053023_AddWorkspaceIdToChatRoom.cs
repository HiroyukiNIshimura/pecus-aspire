using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkspaceIdToChatRoom : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "WorkspaceId",
                table: "ChatRooms",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatRooms_OrganizationId_WorkspaceId",
                table: "ChatRooms",
                columns: new[] { "OrganizationId", "WorkspaceId" },
                unique: true,
                filter: "\"Type\" = 1 AND \"WorkspaceId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ChatRooms_WorkspaceId",
                table: "ChatRooms",
                column: "WorkspaceId");

            migrationBuilder.AddForeignKey(
                name: "FK_ChatRooms_Workspaces_WorkspaceId",
                table: "ChatRooms",
                column: "WorkspaceId",
                principalTable: "Workspaces",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChatRooms_Workspaces_WorkspaceId",
                table: "ChatRooms");

            migrationBuilder.DropIndex(
                name: "IX_ChatRooms_OrganizationId_WorkspaceId",
                table: "ChatRooms");

            migrationBuilder.DropIndex(
                name: "IX_ChatRooms_WorkspaceId",
                table: "ChatRooms");

            migrationBuilder.DropColumn(
                name: "WorkspaceId",
                table: "ChatRooms");
        }
    }
}
