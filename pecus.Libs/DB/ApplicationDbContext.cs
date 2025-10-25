using Microsoft.EntityFrameworkCore;
using Pecus.Libs.DB.Models;

namespace Pecus.Libs.DB;

/// <summary>
/// アプリケーションのDbContext
/// </summary>
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    /// <summary>
    /// ユーザーテーブル
    /// </summary>
    public DbSet<User> Users { get; set; }

    /// <summary>
    /// ロールテーブル
    /// </summary>
    public DbSet<Role> Roles { get; set; }

    /// <summary>
    /// 権限テーブル
    /// </summary>
    public DbSet<Permission> Permissions { get; set; }

    /// <summary>
    /// 組織テーブル
    /// </summary>
    public DbSet<Organization> Organizations { get; set; }

    /// <summary>
    /// ワークスペーステーブル
    /// </summary>
    public DbSet<Workspace> Workspaces { get; set; }

    /// <summary>
    /// ワークスペースユーザーテーブル
    /// </summary>
    public DbSet<WorkspaceUser> WorkspaceUsers { get; set; }

    /// <summary>
    /// ジャンルテーブル
    /// </summary>
    public DbSet<Genre> Genres { get; set; }

    /// <summary>
    /// ワークスペースアイテムテーブル
    /// </summary>
    public DbSet<WorkspaceItem> WorkspaceItems { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Userエンティティの設定
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.LoginId).IsRequired().HasMaxLength(64);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.AvatarType).HasMaxLength(20).HasDefaultValue("auto-generated");
            entity.Property(e => e.AvatarUrl).HasMaxLength(500);
            entity.HasIndex(e => e.LoginId).IsUnique();
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();

            // User と Organization の多対一リレーションシップ
            entity
                .HasOne(u => u.Organization)
                .WithMany(o => o.Users)
                .HasForeignKey(u => u.OrganizationId)
                .OnDelete(DeleteBehavior.SetNull);

            // User と Role の多対多リレーションシップ
            entity
                .HasMany(u => u.Roles)
                .WithMany(r => r.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "UserRole",
                    j => j.HasOne<Role>().WithMany().HasForeignKey("RoleId"),
                    j => j.HasOne<User>().WithMany().HasForeignKey("UserId"),
                    j =>
                    {
                        j.HasKey("UserId", "RoleId");
                        j.ToTable("UserRoles");
                    }
                );
        });

        // Roleエンティティの設定
        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(200);
            entity.HasIndex(e => e.Name).IsUnique();

            // Role と Permission の多対多リレーションシップ
            entity
                .HasMany(r => r.Permissions)
                .WithMany(p => p.Roles)
                .UsingEntity<Dictionary<string, object>>(
                    "RolePermission",
                    j => j.HasOne<Permission>().WithMany().HasForeignKey("PermissionId"),
                    j => j.HasOne<Role>().WithMany().HasForeignKey("RoleId"),
                    j =>
                    {
                        j.HasKey("RoleId", "PermissionId");
                        j.ToTable("RolePermissions");
                    }
                );
        });

        // Permissionエンティティの設定
        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(200);
            entity.Property(e => e.Category).HasMaxLength(50);
            entity.HasIndex(e => e.Name).IsUnique();
        });

        // Organizationエンティティの設定
        modelBuilder.Entity<Organization>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Code).HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.RepresentativeName).HasMaxLength(100);
            entity.Property(e => e.PhoneNumber).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Email).HasMaxLength(100);
            entity.HasIndex(e => e.Code).IsUnique();
        });

        // Workspaceエンティティの設定
        modelBuilder.Entity<Workspace>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Code).HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.HasIndex(e => e.Code).IsUnique();

            // Workspace と Organization の多対一リレーションシップ
            entity
                .HasOne(w => w.Organization)
                .WithMany(o => o.Workspaces)
                .HasForeignKey(w => w.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            // Workspace と Genre の多対一リレーションシップ
            entity
                .HasOne(w => w.Genre)
                .WithMany(g => g.Workspaces)
                .HasForeignKey(w => w.GenreId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // WorkspaceUserエンティティの設定
        modelBuilder.Entity<WorkspaceUser>(entity =>
        {
            entity.HasKey(wu => new { wu.WorkspaceId, wu.UserId });
            entity.Property(wu => wu.WorkspaceRole).HasMaxLength(50);

            // WorkspaceUser と Workspace の多対一リレーションシップ
            entity
                .HasOne(wu => wu.Workspace)
                .WithMany(w => w.WorkspaceUsers)
                .HasForeignKey(wu => wu.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            // WorkspaceUser と User の多対一リレーションシップ
            entity
                .HasOne(wu => wu.User)
                .WithMany(u => u.WorkspaceUsers)
                .HasForeignKey(wu => wu.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // インデックス
            entity.HasIndex(wu => wu.UserId);
            entity.HasIndex(wu => wu.WorkspaceId);
        });

        // Genreエンティティの設定
        modelBuilder.Entity<Genre>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);
            entity.Property(e => e.Icon).HasMaxLength(50);
            entity.HasIndex(e => e.Name).IsUnique();
            entity.HasIndex(e => e.DisplayOrder);
        });

        // WorkspaceItemエンティティの設定
        modelBuilder.Entity<WorkspaceItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(64);
            entity.Property(e => e.Subject).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Body).IsRequired();
            entity.Property(e => e.Priority).HasDefaultValue(2);
            entity.Property(e => e.IsArchived).HasDefaultValue(false);
            entity.Property(e => e.IsDraft).HasDefaultValue(true);

            // WorkspaceItem と Workspace の多対一リレーションシップ
            entity
                .HasOne(wi => wi.Workspace)
                .WithMany(w => w.WorkspaceItems)
                .HasForeignKey(wi => wi.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            // WorkspaceItem と Owner(User) の多対一リレーションシップ
            entity
                .HasOne(wi => wi.Owner)
                .WithMany()
                .HasForeignKey(wi => wi.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            // WorkspaceItem と Assignee(User) の多対一リレーションシップ
            entity
                .HasOne(wi => wi.Assignee)
                .WithMany()
                .HasForeignKey(wi => wi.AssigneeId)
                .OnDelete(DeleteBehavior.SetNull);

            // WorkspaceItem と Committer(User) の多対一リレーションシップ
            entity
                .HasOne(wi => wi.Committer)
                .WithMany()
                .HasForeignKey(wi => wi.CommitterId)
                .OnDelete(DeleteBehavior.SetNull);

            // インデックス
            entity.HasIndex(wi => new { wi.WorkspaceId, wi.Code }).IsUnique();
            entity.HasIndex(wi => wi.OwnerId);
            entity.HasIndex(wi => wi.AssigneeId);
            entity.HasIndex(wi => wi.CommitterId);
            entity.HasIndex(wi => wi.DueDate);
            entity.HasIndex(wi => wi.Priority);
            entity.HasIndex(wi => wi.IsArchived);
            entity.HasIndex(wi => wi.IsDraft);
        });
    }
}
