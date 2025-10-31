using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkspaceItemRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "workspace_item_relations",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    from_item_id = table.Column<int>(type: "integer", nullable: false),
                    to_item_id = table.Column<int>(type: "integer", nullable: false),
                    relation_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by_user_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workspace_item_relations", x => x.id);
                    table.CheckConstraint("CK_WorkspaceItemRelation_DifferentItems", "from_item_id != to_item_id");
                    table.ForeignKey(
                        name: "FK_workspace_item_relations_Users_created_by_user_id",
                        column: x => x.created_by_user_id,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_workspace_item_relations_WorkspaceItems_from_item_id",
                        column: x => x.from_item_id,
                        principalTable: "WorkspaceItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_workspace_item_relations_WorkspaceItems_to_item_id",
                        column: x => x.to_item_id,
                        principalTable: "WorkspaceItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_workspace_item_relations_created_by_user_id",
                table: "workspace_item_relations",
                column: "created_by_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_workspace_item_relations_from_item_id",
                table: "workspace_item_relations",
                column: "from_item_id");

            migrationBuilder.CreateIndex(
                name: "IX_workspace_item_relations_from_item_id_to_item_id_relation_t~",
                table: "workspace_item_relations",
                columns: new[] { "from_item_id", "to_item_id", "relation_type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_workspace_item_relations_relation_type",
                table: "workspace_item_relations",
                column: "relation_type");

            migrationBuilder.CreateIndex(
                name: "IX_workspace_item_relations_to_item_id",
                table: "workspace_item_relations",
                column: "to_item_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "workspace_item_relations");
        }
    }
}
