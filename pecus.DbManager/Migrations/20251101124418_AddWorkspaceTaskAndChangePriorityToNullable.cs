using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;
using System;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkspaceTaskAndChangePriorityToNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "Priority",
                table: "WorkspaceItems",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 2);

            migrationBuilder.CreateTable(
                name: "WorkspaceTasks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WorkspaceItemId = table.Column<int>(type: "integer", nullable: false),
                    WorkspaceId = table.Column<int>(type: "integer", nullable: false),
                    OrganizationId = table.Column<int>(type: "integer", nullable: false),
                    AssignedUserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    TaskType = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: true),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DueDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EstimatedHours = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    ActualHours = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    ProgressPercentage = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsCompleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDiscarded = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DiscardedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DiscardReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorkspaceTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorkspaceTasks_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkspaceTasks_Users_AssignedUserId",
                        column: x => x.AssignedUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkspaceTasks_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_WorkspaceTasks_WorkspaceItems_WorkspaceItemId",
                        column: x => x.WorkspaceItemId,
                        principalTable: "WorkspaceItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WorkspaceTasks_Workspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalTable: "Workspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaskComments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    WorkspaceTaskId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Content = table.Column<string>(type: "text", nullable: false),
                    CommentType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "Normal"),
                    BeforeValue = table.Column<string>(type: "text", nullable: true),
                    AfterValue = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TaskComments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TaskComments_WorkspaceTasks_WorkspaceTaskId",
                        column: x => x.WorkspaceTaskId,
                        principalTable: "WorkspaceTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TaskTags",
                columns: table => new
                {
                    WorkspaceTaskId = table.Column<int>(type: "integer", nullable: false),
                    TagId = table.Column<int>(type: "integer", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TaskTags", x => new { x.WorkspaceTaskId, x.TagId });
                    table.ForeignKey(
                        name: "FK_TaskTags_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TaskTags_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TaskTags_WorkspaceTasks_WorkspaceTaskId",
                        column: x => x.WorkspaceTaskId,
                        principalTable: "WorkspaceTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TaskComments_CommentType",
                table: "TaskComments",
                column: "CommentType");

            migrationBuilder.CreateIndex(
                name: "IX_TaskComments_CreatedAt",
                table: "TaskComments",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_TaskComments_IsDeleted",
                table: "TaskComments",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_TaskComments_UserId",
                table: "TaskComments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskComments_WorkspaceTaskId",
                table: "TaskComments",
                column: "WorkspaceTaskId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskTags_CreatedAt",
                table: "TaskTags",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_TaskTags_CreatedByUserId",
                table: "TaskTags",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_TaskTags_TagId",
                table: "TaskTags",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_AssignedUserId",
                table: "WorkspaceTasks",
                column: "AssignedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_AssignedUserId_IsCompleted",
                table: "WorkspaceTasks",
                columns: new[] { "AssignedUserId", "IsCompleted" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_CreatedByUserId",
                table: "WorkspaceTasks",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_DisplayOrder",
                table: "WorkspaceTasks",
                column: "DisplayOrder");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_DueDate",
                table: "WorkspaceTasks",
                column: "DueDate");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_IsCompleted",
                table: "WorkspaceTasks",
                column: "IsCompleted");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_IsDiscarded",
                table: "WorkspaceTasks",
                column: "IsDiscarded");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_OrganizationId",
                table: "WorkspaceTasks",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_OrganizationId_IsCompleted",
                table: "WorkspaceTasks",
                columns: new[] { "OrganizationId", "IsCompleted" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_Priority",
                table: "WorkspaceTasks",
                column: "Priority");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_TaskType",
                table: "WorkspaceTasks",
                column: "TaskType");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_WorkspaceId",
                table: "WorkspaceTasks",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_WorkspaceId_IsCompleted",
                table: "WorkspaceTasks",
                columns: new[] { "WorkspaceId", "IsCompleted" });

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_WorkspaceItemId",
                table: "WorkspaceTasks",
                column: "WorkspaceItemId");

            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_WorkspaceItemId_IsCompleted",
                table: "WorkspaceTasks",
                columns: new[] { "WorkspaceItemId", "IsCompleted" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TaskComments");

            migrationBuilder.DropTable(
                name: "TaskTags");

            migrationBuilder.DropTable(
                name: "WorkspaceTasks");

            migrationBuilder.AlterColumn<int>(
                name: "Priority",
                table: "WorkspaceItems",
                type: "integer",
                nullable: false,
                defaultValue: 2,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}