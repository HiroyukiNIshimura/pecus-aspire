using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskTypeTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TaskType",
                table: "WorkspaceTasks",
                newName: "TaskTypeId");

            migrationBuilder.RenameIndex(
                name: "IX_WorkspaceTasks_TaskType",
                table: "WorkspaceTasks",
                newName: "IX_WorkspaceTasks_TaskTypeId");

            migrationBuilder.CreateTable(
                name: "TaskTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Icon = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedByUserId = table.Column<int>(type: "integer", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskTypes", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TaskTypes_Code",
                table: "TaskTypes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TaskTypes_DisplayOrder",
                table: "TaskTypes",
                column: "DisplayOrder");

            migrationBuilder.AddForeignKey(
                name: "FK_WorkspaceTasks_TaskTypes_TaskTypeId",
                table: "WorkspaceTasks",
                column: "TaskTypeId",
                principalTable: "TaskTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WorkspaceTasks_TaskTypes_TaskTypeId",
                table: "WorkspaceTasks");

            migrationBuilder.DropTable(
                name: "TaskTypes");

            migrationBuilder.RenameColumn(
                name: "TaskTypeId",
                table: "WorkspaceTasks",
                newName: "TaskType");

            migrationBuilder.RenameIndex(
                name: "IX_WorkspaceTasks_TaskTypeId",
                table: "WorkspaceTasks",
                newName: "IX_WorkspaceTasks_TaskType");
        }
    }
}
