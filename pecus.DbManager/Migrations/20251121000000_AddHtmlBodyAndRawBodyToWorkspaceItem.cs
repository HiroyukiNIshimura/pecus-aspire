using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddHtmlBodyAndRawBodyToWorkspaceItem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HtmlBody",
                table: "WorkspaceItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RawBody",
                table: "WorkspaceItems",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HtmlBody",
                table: "WorkspaceItems");

            migrationBuilder.DropColumn(
                name: "RawBody",
                table: "WorkspaceItems");
        }
    }
}
