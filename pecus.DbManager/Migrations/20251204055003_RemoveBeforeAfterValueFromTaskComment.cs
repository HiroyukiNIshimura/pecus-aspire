using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class RemoveBeforeAfterValueFromTaskComment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AfterValue",
                table: "TaskComments");

            migrationBuilder.DropColumn(
                name: "BeforeValue",
                table: "TaskComments");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AfterValue",
                table: "TaskComments",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BeforeValue",
                table: "TaskComments",
                type: "text",
                nullable: true);
        }
    }
}
