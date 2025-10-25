using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkspaceItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WorkspaceItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WorkspaceId = table.Column<int>(type: "integer", nullable: false),
                    Code = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Subject = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    OwnerId = table.Column<int>(type: "integer", nullable: false),
                    AssigneeId = table.Column<int>(type: "integer", nullable: true),
                    Priority = table.Column<int>(type: "integer", nullable: false, defaultValue: 2),
                    DueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsDraft = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    CommitterId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkspaceItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkspaceItems_Users_AssigneeId",
                        column: x => x.AssigneeId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_WorkspaceItems_Users_CommitterId",
                        column: x => x.CommitterId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_WorkspaceItems_Users_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkspaceItems_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceItems_AssigneeId",
                table: "WorkspaceItems",
                column: "AssigneeId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceItems_CommitterId",
                table: "WorkspaceItems",
                column: "CommitterId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceItems_DueDate",
                table: "WorkspaceItems",
                column: "DueDate");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceItems_IsArchived",
                table: "WorkspaceItems",
                column: "IsArchived");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceItems_IsDraft",
                table: "WorkspaceItems",
                column: "IsDraft");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceItems_OwnerId",
                table: "WorkspaceItems",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceItems_Priority",
                table: "WorkspaceItems",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceItems_WorkspaceId_Code",
                table: "WorkspaceItems",
                columns: new[] { "WorkspaceId", "Code" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WorkspaceItems");
        }
    }
}
