using Microsoft.EntityFrameworkCore.Migrations;
using System;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class SeparateSearchIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RawBody",
                table: "WorkspaceItems");

            migrationBuilder.CreateTable(
                name: "WorkspaceItemSearchIndices",
                columns: table => new
                {
                    WorkspaceItemId = table.Column<int>(type: "integer", nullable: false),
                    RawBody = table.Column<string>(type: "text", nullable: false),
                    FullText = table.Column<string>(type: "text", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkspaceItemSearchIndices", x => x.WorkspaceItemId);
                    table.ForeignKey(
                        name: "FK_WorkspaceItemSearchIndices_WorkspaceItems_WorkspaceItemId",
                        column: x => x.WorkspaceItemId,
                        principalTable: "WorkspaceItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkspaceItemSearchIndices");

            migrationBuilder.AddColumn<string>(
                name: "RawBody",
                table: "WorkspaceItems",
                type: "text",
                nullable: true);
        }
    }
}
