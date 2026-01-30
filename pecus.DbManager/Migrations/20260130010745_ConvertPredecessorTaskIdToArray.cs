using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class ConvertPredecessorTaskIdToArray : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. 新しい配列カラムを追加
            migrationBuilder.AddColumn<int[]>(
                name: "PredecessorTaskIds",
                table: "WorkspaceTasks",
                type: "integer[]",
                nullable: false,
                defaultValue: System.Array.Empty<int>());

            // 2. 既存データを移行（PredecessorTaskId が NULL でない場合は配列に変換）
            migrationBuilder.Sql("""
                UPDATE "WorkspaceTasks"
                SET "PredecessorTaskIds" = CASE
                    WHEN "PredecessorTaskId" IS NOT NULL THEN ARRAY["PredecessorTaskId"]
                    ELSE ARRAY[]::integer[]
                END;
                """);

            // 3. 古い外部キー制約を削除
            migrationBuilder.DropForeignKey(
                name: "FK_WorkspaceTasks_WorkspaceTasks_PredecessorTaskId",
                table: "WorkspaceTasks");

            // 4. 古いインデックスを削除
            migrationBuilder.DropIndex(
                name: "IX_WorkspaceTasks_PredecessorTaskId",
                table: "WorkspaceTasks");

            // 5. 古いチェック制約を削除
            migrationBuilder.DropCheckConstraint(
                name: "CK_WorkspaceTask_NoSelfReference",
                table: "WorkspaceTasks");

            // 6. 古いカラムを削除
            migrationBuilder.DropColumn(
                name: "PredecessorTaskId",
                table: "WorkspaceTasks");

            // 7. 新しい GIN インデックスを作成
            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_PredecessorTaskIds",
                table: "WorkspaceTasks",
                column: "PredecessorTaskIds")
                .Annotation("Npgsql:IndexMethod", "gin");

            // 8. 新しいチェック制約を追加（自己参照防止）
            migrationBuilder.AddCheckConstraint(
                name: "CK_WorkspaceTask_NoSelfReference",
                table: "WorkspaceTasks",
                sql: "NOT (\"Id\" = ANY(\"PredecessorTaskIds\"))");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 1. 新しいチェック制約を削除
            migrationBuilder.DropCheckConstraint(
                name: "CK_WorkspaceTask_NoSelfReference",
                table: "WorkspaceTasks");

            // 2. GIN インデックスを削除
            migrationBuilder.DropIndex(
                name: "IX_WorkspaceTasks_PredecessorTaskIds",
                table: "WorkspaceTasks");

            // 3. 古いカラムを復元
            migrationBuilder.AddColumn<int>(
                name: "PredecessorTaskId",
                table: "WorkspaceTasks",
                type: "integer",
                nullable: true);

            // 4. データを復元（配列の最初の要素を使用）
            migrationBuilder.Sql("""
                UPDATE "WorkspaceTasks"
                SET "PredecessorTaskId" = CASE
                    WHEN array_length("PredecessorTaskIds", 1) > 0 THEN "PredecessorTaskIds"[1]
                    ELSE NULL
                END;
                """);

            // 5. 新しいカラムを削除
            migrationBuilder.DropColumn(
                name: "PredecessorTaskIds",
                table: "WorkspaceTasks");

            // 6. 古いインデックスを復元
            migrationBuilder.CreateIndex(
                name: "IX_WorkspaceTasks_PredecessorTaskId",
                table: "WorkspaceTasks",
                column: "PredecessorTaskId");

            // 7. 古いチェック制約を復元
            migrationBuilder.AddCheckConstraint(
                name: "CK_WorkspaceTask_NoSelfReference",
                table: "WorkspaceTasks",
                sql: "\"PredecessorTaskId\" IS NULL OR \"PredecessorTaskId\" != \"Id\"");

            // 8. 古い外部キー制約を復元
            migrationBuilder.AddForeignKey(
                name: "FK_WorkspaceTasks_WorkspaceTasks_PredecessorTaskId",
                table: "WorkspaceTasks",
                column: "PredecessorTaskId",
                principalTable: "WorkspaceTasks",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
