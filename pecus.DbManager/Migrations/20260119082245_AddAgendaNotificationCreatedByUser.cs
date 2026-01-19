using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddAgendaNotificationCreatedByUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CreatedByUserId",
                table: "AgendaNotifications",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AgendaNotifications_CreatedByUserId",
                table: "AgendaNotifications",
                column: "CreatedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_AgendaNotifications_Users_CreatedByUserId",
                table: "AgendaNotifications",
                column: "CreatedByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AgendaNotifications_Users_CreatedByUserId",
                table: "AgendaNotifications");

            migrationBuilder.DropIndex(
                name: "IX_AgendaNotifications_CreatedByUserId",
                table: "AgendaNotifications");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "AgendaNotifications");
        }
    }
}
