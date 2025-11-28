using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class ChangeWorkspaceRoleToEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 一時カラムを作成
            migrationBuilder.AddColumn<int>(
                name: "WorkspaceRoleTemp",
                table: "WorkspaceUsers",
                type: "integer",
                nullable: true);

            // 既存の文字列値を数値に変換
            // Viewer = 1, Member = 2, Owner = 3
            migrationBuilder.Sql(@"
                UPDATE ""WorkspaceUsers""
                SET ""WorkspaceRoleTemp"" = CASE
                    WHEN ""WorkspaceRole"" = 'Viewer' THEN 1
                    WHEN ""WorkspaceRole"" = 'Member' THEN 2
                    WHEN ""WorkspaceRole"" = 'Owner' THEN 3
                    ELSE NULL
                END
            ");

            // 元のカラムを削除
            migrationBuilder.DropColumn(
                name: "WorkspaceRole",
                table: "WorkspaceUsers");

            // 一時カラムをリネーム
            migrationBuilder.RenameColumn(
                name: "WorkspaceRoleTemp",
                table: "WorkspaceUsers",
                newName: "WorkspaceRole");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 一時カラムを作成
            migrationBuilder.AddColumn<string>(
                name: "WorkspaceRoleTemp",
                table: "WorkspaceUsers",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            // 数値を文字列に変換
            migrationBuilder.Sql(@"
                UPDATE ""WorkspaceUsers""
                SET ""WorkspaceRoleTemp"" = CASE
                    WHEN ""WorkspaceRole"" = 1 THEN 'Viewer'
                    WHEN ""WorkspaceRole"" = 2 THEN 'Member'
                    WHEN ""WorkspaceRole"" = 3 THEN 'Owner'
                    ELSE NULL
                END
            ");

            // 元のカラムを削除
            migrationBuilder.DropColumn(
                name: "WorkspaceRole",
                table: "WorkspaceUsers");

            // 一時カラムをリネーム
            migrationBuilder.RenameColumn(
                name: "WorkspaceRoleTemp",
                table: "WorkspaceUsers",
                newName: "WorkspaceRole");
        }
    }
}
