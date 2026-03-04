using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddSortOrderToWorkspaceItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "WorkspaceItems",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // 既存データに ItemNumber 順で SortOrder を設定（ワークスペースごと・親ごと）
            migrationBuilder.Sql("""
                WITH ranked AS (
                    SELECT wi."Id",
                           ROW_NUMBER() OVER (
                               PARTITION BY wi."WorkspaceId",
                                            COALESCE(r."from_item_id", 0)
                               ORDER BY wi."ItemNumber"
                           ) * 1000 AS new_sort
                    FROM "WorkspaceItems" wi
                    LEFT JOIN "WorkspaceItemRelations" r
                        ON r."to_item_id" = wi."Id" AND r."relation_type" = 0
                )
                UPDATE "WorkspaceItems"
                SET "SortOrder" = ranked.new_sort
                FROM ranked
                WHERE "WorkspaceItems"."Id" = ranked."Id";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "WorkspaceItems");
        }
    }
}