using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class SeparateAttendanceResponse : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "AgendaAttendees");

            migrationBuilder.CreateTable(
                name: "AgendaAttendanceResponses",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgendaId = table.Column<long>(type: "bigint", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    OccurrenceIndex = table.Column<int>(type: "integer", nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    RespondedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgendaAttendanceResponses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AgendaAttendanceResponses_Agendas_AgendaId",
                        column: x => x.AgendaId,
                        principalTable: "Agendas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AgendaAttendanceResponses_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AgendaAttendanceResponses_AgendaId_OccurrenceIndex",
                table: "AgendaAttendanceResponses",
                columns: new[] { "AgendaId", "OccurrenceIndex" });

            migrationBuilder.CreateIndex(
                name: "IX_AgendaAttendanceResponses_AgendaId_UserId_OccurrenceIndex",
                table: "AgendaAttendanceResponses",
                columns: new[] { "AgendaId", "UserId", "OccurrenceIndex" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AgendaAttendanceResponses_UserId",
                table: "AgendaAttendanceResponses",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AgendaAttendanceResponses");

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "AgendaAttendees",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
