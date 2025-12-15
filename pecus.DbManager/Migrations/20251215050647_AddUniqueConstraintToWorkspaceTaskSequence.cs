using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueConstraintToWorkspaceTaskSequence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 既存のタスクに対してSequence番号を採番（WorkspaceItemId単位で連番）
            migrationBuilder.Sql(@"
                WITH numbered_tasks AS (
                    SELECT
                        ""Id"",
                        ROW_NUMBER() OVER (PARTITION BY ""WorkspaceItemId"" ORDER BY ""CreatedAt"", ""Id"") AS new_sequence
                    FROM ""WorkspaceTasks""
                )
                UPDATE ""WorkspaceTasks"" AS wt
                SET ""Sequence"" = nt.new_sequence
                FROM numbered_tasks AS nt
                WHERE wt.""Id"" = nt.""Id"";
            ");

            // UNIQUE制約を追加
            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_WorkspaceItemId_Sequence_Unique",
                table: "WorkspaceTasks",
                columns: new[] { "WorkspaceItemId", "Sequence" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_WorkspaceTasks_WorkspaceItemId_Sequence_Unique",
                table: "WorkspaceTasks");
        }
    }
}
