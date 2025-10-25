using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkspaceItemPin : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WorkspaceItemPins",
                columns: table => new
                {
                    WorkspaceItemId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkspaceItemPins", x => new { x.WorkspaceItemId, x.UserId });
                    table.ForeignKey(
                        name: "FK_WorkspaceItemPins_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkspaceItemPins_WorkspaceItems_WorkspaceItemId",
                        column: x => x.WorkspaceItemId,
                        principalTable: "WorkspaceItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceItemPins_CreatedAt",
                table: "WorkspaceItemPins",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceItemPins_UserId",
                table: "WorkspaceItemPins",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkspaceItemPins");
        }
    }
}
