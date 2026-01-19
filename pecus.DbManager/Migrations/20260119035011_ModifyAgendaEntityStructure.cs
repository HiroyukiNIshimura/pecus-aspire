using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class ModifyAgendaEntityStructure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Agendas_WorkspaceId_StartAt_EndAt",
                table: "Agendas");

            migrationBuilder.AlterColumn<int>(
                name: "WorkspaceId",
                table: "Agendas",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "OrganizationId",
                table: "Agendas",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Agendas_OrganizationId_WorkspaceId_StartAt_EndAt",
                table: "Agendas",
                columns: new[] { "OrganizationId", "WorkspaceId", "StartAt", "EndAt" });

            migrationBuilder.CreateIndex(
                name: "IX_Agendas_WorkspaceId",
                table: "Agendas",
                column: "WorkspaceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Agendas_Organizations_OrganizationId",
                table: "Agendas",
                column: "OrganizationId",
                principalTable: "Organizations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Agendas_Organizations_OrganizationId",
                table: "Agendas");

            migrationBuilder.DropIndex(
                name: "IX_Agendas_OrganizationId_WorkspaceId_StartAt_EndAt",
                table: "Agendas");

            migrationBuilder.DropIndex(
                name: "IX_Agendas_WorkspaceId",
                table: "Agendas");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "Agendas");

            migrationBuilder.AlterColumn<int>(
                name: "WorkspaceId",
                table: "Agendas",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Agendas_WorkspaceId_StartAt_EndAt",
                table: "Agendas",
                columns: new[] { "WorkspaceId", "StartAt", "EndAt" });
        }
    }
}
