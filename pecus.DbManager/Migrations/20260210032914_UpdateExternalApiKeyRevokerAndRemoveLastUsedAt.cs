using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class UpdateExternalApiKeyRevokerAndRemoveLastUsedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "LastUsedAt",
                table: "ExternalApiKeys",
                newName: "RevokedAt");

            migrationBuilder.AddColumn<int>(
                name: "RevokedByUserId",
                table: "ExternalApiKeys",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ExternalApiKeys_RevokedByUserId",
                table: "ExternalApiKeys",
                column: "RevokedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ExternalApiKeys_Users_RevokedByUserId",
                table: "ExternalApiKeys",
                column: "RevokedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ExternalApiKeys_Users_RevokedByUserId",
                table: "ExternalApiKeys");

            migrationBuilder.DropIndex(
                name: "IX_ExternalApiKeys_RevokedByUserId",
                table: "ExternalApiKeys");

            migrationBuilder.DropColumn(
                name: "RevokedByUserId",
                table: "ExternalApiKeys");

            migrationBuilder.RenameColumn(
                name: "RevokedAt",
                table: "ExternalApiKeys",
                newName: "LastUsedAt");
        }
    }
}
