using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class ChangeAgendaExceptionToOccurrenceIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 既存のAgendaExceptionsデータを削除（OccurrenceIndexが計算できないため）
            migrationBuilder.Sql("DELETE FROM \"AgendaExceptions\"");

            // 既存のユニークインデックスを削除
            migrationBuilder.DropIndex(
                name: "IX_AgendaExceptions_AgendaId_OriginalStartAt",
                table: "AgendaExceptions");

            // OriginalStartAtカラムを削除
            migrationBuilder.DropColumn(
                name: "OriginalStartAt",
                table: "AgendaExceptions");

            // OccurrenceIndexカラムを追加
            migrationBuilder.AddColumn<int>(
                name: "OccurrenceIndex",
                table: "AgendaExceptions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // 新しいユニークインデックスを作成
            migrationBuilder.CreateIndex(
                name: "IX_AgendaExceptions_AgendaId_OccurrenceIndex",
                table: "AgendaExceptions",
                columns: new[] { "AgendaId", "OccurrenceIndex" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // ユニークインデックスを削除
            migrationBuilder.DropIndex(
                name: "IX_AgendaExceptions_AgendaId_OccurrenceIndex",
                table: "AgendaExceptions");

            // OccurrenceIndexカラムを削除
            migrationBuilder.DropColumn(
                name: "OccurrenceIndex",
                table: "AgendaExceptions");

            // OriginalStartAtカラムを追加
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "OriginalStartAt",
                table: "AgendaExceptions",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTimeOffset(new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 0, 0, 0, 0)));

            // 既存のユニークインデックスを再作成
            migrationBuilder.CreateIndex(
                name: "IX_AgendaExceptions_AgendaId_OriginalStartAt",
                table: "AgendaExceptions",
                columns: new[] { "AgendaId", "OriginalStartAt" },
                unique: true);
        }
    }
}
