using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddBotRowVersion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // xmin は PostgreSQL のシステムカラムであり、全テーブルに自動的に存在するため
            // スキーマ変更は不要。このマイグレーションは EF Core のモデルスナップショットを
            // 更新するためだけに存在する。
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // xmin はシステムカラムのため削除不可
        }
    }
}