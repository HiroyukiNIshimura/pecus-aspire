using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddAchievementEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BadgeVisibility",
                table: "UserSettings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "GamificationAllowUserOverride",
                table: "OrganizationSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "GamificationBadgeVisibility",
                table: "OrganizationSettings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "GamificationEnabled",
                table: "OrganizationSettings",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "AchievementMasters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    NameEn = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    DescriptionEn = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    IconPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Difficulty = table.Column<int>(type: "integer", nullable: false),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    IsSecret = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    xmin = table.Column<uint>(type: "xid", rowVersion: true, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AchievementMasters", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "UserAchievements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    AchievementMasterId = table.Column<int>(type: "integer", nullable: false),
                    OrganizationId = table.Column<int>(type: "integer", nullable: false),
                    EarnedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsNotified = table.Column<bool>(type: "boolean", nullable: false),
                    NotifiedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsMainBadge = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserAchievements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserAchievements_AchievementMasters_AchievementMasterId",
                        column: x => x.AchievementMasterId,
                        principalTable: "AchievementMasters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserAchievements_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserAchievements_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AchievementMasters_Category_SortOrder",
                table: "AchievementMasters",
                columns: new[] { "Category", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_AchievementMasters_Code",
                table: "AchievementMasters",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AchievementMasters_IsActive",
                table: "AchievementMasters",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_UserAchievements_AchievementMasterId",
                table: "UserAchievements",
                column: "AchievementMasterId");

            migrationBuilder.CreateIndex(
                name: "IX_UserAchievements_OrganizationId",
                table: "UserAchievements",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_UserAchievements_UserId_AchievementMasterId",
                table: "UserAchievements",
                columns: new[] { "UserId", "AchievementMasterId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserAchievements_UserId_IsMainBadge",
                table: "UserAchievements",
                columns: new[] { "UserId", "IsMainBadge" });

            migrationBuilder.CreateIndex(
                name: "IX_UserAchievements_UserId_IsNotified",
                table: "UserAchievements",
                columns: new[] { "UserId", "IsNotified" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserAchievements");

            migrationBuilder.DropTable(
                name: "AchievementMasters");

            migrationBuilder.DropColumn(
                name: "BadgeVisibility",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "GamificationAllowUserOverride",
                table: "OrganizationSettings");

            migrationBuilder.DropColumn(
                name: "GamificationBadgeVisibility",
                table: "OrganizationSettings");

            migrationBuilder.DropColumn(
                name: "GamificationEnabled",
                table: "OrganizationSettings");
        }
    }
}
