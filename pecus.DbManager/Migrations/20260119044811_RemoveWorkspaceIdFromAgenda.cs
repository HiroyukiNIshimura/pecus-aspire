using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class RemoveWorkspaceIdFromAgenda : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Agendas_Workspaces_WorkspaceId",
                table: "Agendas");

            migrationBuilder.DropIndex(
                name: "IX_Agendas_OrganizationId_WorkspaceId_StartAt_EndAt",
                table: "Agendas");

            migrationBuilder.DropIndex(
                name: "IX_Agendas_WorkspaceId",
                table: "Agendas");

            migrationBuilder.DropColumn(
                name: "WorkspaceId",
                table: "Agendas");

            migrationBuilder.CreateIndex(
                name: "IX_Agendas_OrganizationId_StartAt_EndAt",
                table: "Agendas",
                columns: new[] { "OrganizationId", "StartAt", "EndAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Agendas_OrganizationId_StartAt_EndAt",
                table: "Agendas");

            migrationBuilder.AddColumn<int>(
                name: "WorkspaceId",
                table: "Agendas",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Agendas_OrganizationId_WorkspaceId_StartAt_EndAt",
                table: "Agendas",
                columns: new[] { "OrganizationId", "WorkspaceId", "StartAt", "EndAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Agendas_WorkspaceId",
                table: "Agendas",
                column: "WorkspaceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Agendas_Workspaces_WorkspaceId",
                table: "Agendas",
                column: "WorkspaceId",
                principalTable: "Workspaces",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
