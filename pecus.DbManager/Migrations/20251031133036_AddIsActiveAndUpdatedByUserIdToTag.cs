using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddIsActiveAndUpdatedByUserIdToTag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Tags",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedByUserId",
                table: "Tags",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tags_UpdatedByUserId",
                table: "Tags",
                column: "UpdatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Tags_Users_UpdatedByUserId",
                table: "Tags",
                column: "UpdatedByUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Tags_Users_UpdatedByUserId",
                table: "Tags");

            migrationBuilder.DropIndex(
                name: "IX_Tags_UpdatedByUserId",
                table: "Tags");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Tags");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "Tags");
        }
    }
}
