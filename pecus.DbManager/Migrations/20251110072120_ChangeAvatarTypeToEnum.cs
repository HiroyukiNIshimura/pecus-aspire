using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class ChangeAvatarTypeToEnum : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "AvatarType",
                table: "Users",
                type: "integer",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldDefaultValue: "auto-generated");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "AvatarType",
                table: "Users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "auto-generated",
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
        }
    }
}
