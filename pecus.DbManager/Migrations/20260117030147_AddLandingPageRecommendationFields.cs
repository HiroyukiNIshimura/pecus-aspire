using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddLandingPageRecommendationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LandingPageRecommendationRefusedAt",
                table: "UserSettings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LandingPageUpdatedAt",
                table: "UserSettings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "PendingLandingPageRecommendation",
                table: "UserSettings",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LandingPageRecommendationRefusedAt",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "LandingPageUpdatedAt",
                table: "UserSettings");

            migrationBuilder.DropColumn(
                name: "PendingLandingPageRecommendation",
                table: "UserSettings");
        }
    }
}
