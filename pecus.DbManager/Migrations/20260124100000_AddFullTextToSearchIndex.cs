using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddFullTextToSearchIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "FullText",
                table: "WorkspaceItemSearchIndices",
                type: "text",
                nullable: false,
                defaultValue: "");

            // pgroonga インデックスを作成
            migrationBuilder.Sql(
                @"CREATE INDEX idx_workspace_item_search_indices_fulltext_pgroonga
                  ON ""WorkspaceItemSearchIndices""
                  USING pgroonga (""FullText"")");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // pgroonga インデックスを削除
            migrationBuilder.Sql(
                @"DROP INDEX IF EXISTS idx_workspace_item_search_indices_fulltext_pgroonga");

            migrationBuilder.DropColumn(
                name: "FullText",
                table: "WorkspaceItemSearchIndices");
        }
    }
}
