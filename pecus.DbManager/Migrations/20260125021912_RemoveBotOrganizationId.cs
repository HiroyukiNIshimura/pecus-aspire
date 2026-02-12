using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class RemoveBotOrganizationId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bots_Organizations_OrganizationId",
                table: "Bots");

            migrationBuilder.DropIndex(
                name: "IX_ChatActors_BotId",
                table: "ChatActors");

            migrationBuilder.DropIndex(
                name: "IX_Bots_OrganizationId",
                table: "Bots");

            migrationBuilder.DropColumn(
                name: "OrganizationId",
                table: "Bots");

            migrationBuilder.AlterColumn<string>(
                name: "Constraint",
                table: "Bots",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChatActors_BotId",
                table: "ChatActors",
                column: "BotId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatActors_OrganizationId_BotId",
                table: "ChatActors",
                columns: new[] { "OrganizationId", "BotId" },
                unique: true,
                filter: "\"BotId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Bots_Type",
                table: "Bots",
                column: "Type",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChatActors_BotId",
                table: "ChatActors");

            migrationBuilder.DropIndex(
                name: "IX_ChatActors_OrganizationId_BotId",
                table: "ChatActors");

            migrationBuilder.DropIndex(
                name: "IX_Bots_Type",
                table: "Bots");

            migrationBuilder.AlterColumn<string>(
                name: "Constraint",
                table: "Bots",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000,
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OrganizationId",
                table: "Bots",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_ChatActors_BotId",
                table: "ChatActors",
                column: "BotId",
                unique: true,
                filter: "\"BotId\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Bots_OrganizationId",
                table: "Bots",
                column: "OrganizationId");

            migrationBuilder.AddForeignKey(
                name: "FK_Bots_Organizations_OrganizationId",
                table: "Bots",
                column: "OrganizationId",
                principalTable: "Organizations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}