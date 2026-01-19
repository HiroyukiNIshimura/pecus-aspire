using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace pecus.DbManager.Migrations
{
    /// <inheritdoc />
    public partial class AddAgendaRecurrenceAndNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CancellationReason",
                table: "Agendas",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "CancelledAt",
                table: "Agendas",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CancelledByUserId",
                table: "Agendas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultReminders",
                table: "Agendas",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCancelled",
                table: "Agendas",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceCount",
                table: "Agendas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "RecurrenceEndDate",
                table: "Agendas",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceInterval",
                table: "Agendas",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceType",
                table: "Agendas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RecurrenceWeekOfMonth",
                table: "Agendas",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomReminders",
                table: "AgendaAttendees",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AgendaExceptions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgendaId = table.Column<long>(type: "bigint", nullable: false),
                    OriginalStartAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    IsCancelled = table.Column<bool>(type: "boolean", nullable: false),
                    CancellationReason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ModifiedStartAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ModifiedEndAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ModifiedTitle = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ModifiedLocation = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    ModifiedUrl = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ModifiedDescription = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgendaExceptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AgendaExceptions_Agendas_AgendaId",
                        column: x => x.AgendaId,
                        principalTable: "Agendas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AgendaExceptions_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AgendaNotifications",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgendaId = table.Column<long>(type: "bigint", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    OccurrenceStartAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    IsRead = table.Column<bool>(type: "boolean", nullable: false),
                    IsEmailSent = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgendaNotifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AgendaNotifications_Agendas_AgendaId",
                        column: x => x.AgendaId,
                        principalTable: "Agendas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AgendaNotifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AgendaReminderLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgendaId = table.Column<long>(type: "bigint", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    OccurrenceStartAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    MinutesBefore = table.Column<int>(type: "integer", nullable: false),
                    SentAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgendaReminderLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AgendaReminderLogs_Agendas_AgendaId",
                        column: x => x.AgendaId,
                        principalTable: "Agendas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AgendaReminderLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Agendas_CancelledByUserId",
                table: "Agendas",
                column: "CancelledByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_Agendas_OrganizationId_IsCancelled",
                table: "Agendas",
                columns: new[] { "OrganizationId", "IsCancelled" });

            migrationBuilder.CreateIndex(
                name: "IX_AgendaExceptions_AgendaId_OriginalStartAt",
                table: "AgendaExceptions",
                columns: new[] { "AgendaId", "OriginalStartAt" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AgendaExceptions_CreatedByUserId",
                table: "AgendaExceptions",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AgendaNotifications_AgendaId",
                table: "AgendaNotifications",
                column: "AgendaId");

            migrationBuilder.CreateIndex(
                name: "IX_AgendaNotifications_UserId_IsRead_CreatedAt",
                table: "AgendaNotifications",
                columns: new[] { "UserId", "IsRead", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_AgendaReminderLogs_AgendaId_UserId_OccurrenceStartAt_Minute~",
                table: "AgendaReminderLogs",
                columns: new[] { "AgendaId", "UserId", "OccurrenceStartAt", "MinutesBefore" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AgendaReminderLogs_UserId",
                table: "AgendaReminderLogs",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Agendas_Users_CancelledByUserId",
                table: "Agendas",
                column: "CancelledByUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Agendas_Users_CancelledByUserId",
                table: "Agendas");

            migrationBuilder.DropTable(
                name: "AgendaExceptions");

            migrationBuilder.DropTable(
                name: "AgendaNotifications");

            migrationBuilder.DropTable(
                name: "AgendaReminderLogs");

            migrationBuilder.DropIndex(
                name: "IX_Agendas_CancelledByUserId",
                table: "Agendas");

            migrationBuilder.DropIndex(
                name: "IX_Agendas_OrganizationId_IsCancelled",
                table: "Agendas");

            migrationBuilder.DropColumn(
                name: "CancellationReason",
                table: "Agendas");

            migrationBuilder.DropColumn(
                name: "CancelledAt",
                table: "Agendas");

            migrationBuilder.DropColumn(
                name: "CancelledByUserId",
                table: "Agendas");

            migrationBuilder.DropColumn(
                name: "DefaultReminders",
                table: "Agendas");

            migrationBuilder.DropColumn(
                name: "IsCancelled",
                table: "Agendas");

            migrationBuilder.DropColumn(
                name: "RecurrenceCount",
                table: "Agendas");

            migrationBuilder.DropColumn(
                name: "RecurrenceEndDate",
                table: "Agendas");

            migrationBuilder.DropColumn(
                name: "RecurrenceInterval",
                table: "Agendas");

            migrationBuilder.DropColumn(
                name: "RecurrenceType",
                table: "Agendas");

            migrationBuilder.DropColumn(
                name: "RecurrenceWeekOfMonth",
                table: "Agendas");

            migrationBuilder.DropColumn(
                name: "CustomReminders",
                table: "AgendaAttendees");
        }
    }
}
