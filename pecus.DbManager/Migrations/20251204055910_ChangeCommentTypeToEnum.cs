using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class ChangeCommentTypeToEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // まず一時カラムを追加
            migrationBuilder.AddColumn<int>(
                name: "CommentType_New",
                table: "TaskComments",
                type: "integer",
                nullable: true);

            // 既存の文字列データを数値に変換
            // TaskCommentType: Normal=1, Memo=2, HelpWanted=3, NeedReply=4, Reminder=5, Urge=6
            migrationBuilder.Sql(@"
                UPDATE ""TaskComments""
                SET ""CommentType_New"" = CASE ""CommentType""
                    WHEN 'Normal' THEN 1
                    WHEN 'Memo' THEN 2
                    WHEN 'HelpWanted' THEN 3
                    WHEN 'NeedReply' THEN 4
                    WHEN 'Reminder' THEN 5
                    WHEN 'Urge' THEN 6
                    WHEN 'StatusChange' THEN 1
                    WHEN 'AssigneeChange' THEN 1
                    WHEN 'PriorityChange' THEN 1
                    ELSE 1
                END
            ");

            // 古いカラムを削除
            migrationBuilder.DropColumn(
                name: "CommentType",
                table: "TaskComments");

            // 新しいカラムの名前を変更
            migrationBuilder.RenameColumn(
                name: "CommentType_New",
                table: "TaskComments",
                newName: "CommentType");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 一時カラムを追加
            migrationBuilder.AddColumn<string>(
                name: "CommentType_Old",
                table: "TaskComments",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Normal");

            // 数値データを文字列に変換
            migrationBuilder.Sql(@"
                UPDATE ""TaskComments""
                SET ""CommentType_Old"" = CASE ""CommentType""
                    WHEN 1 THEN 'Normal'
                    WHEN 2 THEN 'Memo'
                    WHEN 3 THEN 'HelpWanted'
                    WHEN 4 THEN 'NeedReply'
                    WHEN 5 THEN 'Reminder'
                    WHEN 6 THEN 'Urge'
                    ELSE 'Normal'
                END
            ");

            // 古いカラムを削除
            migrationBuilder.DropColumn(
                name: "CommentType",
                table: "TaskComments");

            // 新しいカラムの名前を変更
            migrationBuilder.RenameColumn(
                name: "CommentType_Old",
                table: "TaskComments",
                newName: "CommentType");
        }
    }
}
