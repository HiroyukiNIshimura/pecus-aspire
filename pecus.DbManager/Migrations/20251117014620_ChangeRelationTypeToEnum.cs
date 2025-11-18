using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class ChangeRelationTypeToEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 文字列から整数へのマッピングを行う
            migrationBuilder.Sql(@"
                UPDATE workspace_item_relations
                SET relation_type = CASE
                    WHEN relation_type = 'related' THEN '1'
                    WHEN relation_type = 'blocks' THEN '2'
                    WHEN relation_type = 'blocked_by' THEN '3'
                    WHEN relation_type = 'depends_on' THEN '4'
                    WHEN relation_type = 'duplicates' THEN '5'
                    WHEN relation_type = 'subtask_of' THEN '6'
                    WHEN relation_type = 'parent_of' THEN '7'
                    WHEN relation_type = 'relates_to' THEN '8'
                    ELSE relation_type
                END
                WHERE relation_type IS NOT NULL;
            ");

            // カラムの型を integer に変更（USING 句で明示的に変換）
            migrationBuilder.Sql(@"
                ALTER TABLE workspace_item_relations
                ALTER COLUMN relation_type TYPE integer
                USING relation_type::integer;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // カラムの型を varchar に戻す
            migrationBuilder.Sql(@"
                ALTER TABLE workspace_item_relations
                ALTER COLUMN relation_type TYPE character varying(50)
                USING relation_type::text;
            ");

            // 整数から文字列へのマッピングを行う
            migrationBuilder.Sql(@"
                UPDATE workspace_item_relations
                SET relation_type = CASE
                    WHEN relation_type = '1' THEN 'related'
                    WHEN relation_type = '2' THEN 'blocks'
                    WHEN relation_type = '3' THEN 'blocked_by'
                    WHEN relation_type = '4' THEN 'depends_on'
                    WHEN relation_type = '5' THEN 'duplicates'
                    WHEN relation_type = '6' THEN 'subtask_of'
                    WHEN relation_type = '7' THEN 'parent_of'
                    WHEN relation_type = '8' THEN 'relates_to'
                    ELSE relation_type
                END
                WHERE relation_type IS NOT NULL;
            ");
        }
    }
}