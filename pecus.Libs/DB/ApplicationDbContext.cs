using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Pecus.Libs.DB.Models;
using Pecus.Libs.DB.Models.Enums;

namespace Pecus.Libs.DB;

/// <summary>
/// アプリケーションのDbContext
/// </summary>
public class ApplicationDbContext : DbContext
{
    /// <summary>
    /// ApplicationDbContext のコンストラクタ
    /// </summary>
    /// <param name="options">DbContext のオプション</param>
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

    /// <summary>
    /// タグテーブル
    /// </summary>
    public DbSet<Tag> Tags { get; set; }

    /// <summary>
    /// ワークスペースアイテムタグテーブル（中間テーブル）
    /// </summary>
    public DbSet<WorkspaceItemTag> WorkspaceItemTags { get; set; }

    /// <summary>
    /// ワークスペースアイテムPINテーブル（中間テーブル）
    /// </summary>
    public DbSet<WorkspaceItemPin> WorkspaceItemPins { get; set; }

    /// <summary>
    /// ワークスペースアイテム添付ファイルテーブル
    /// </summary>
    public DbSet<WorkspaceItemAttachment> WorkspaceItemAttachments { get; set; }

    /// <summary>
    /// ワークスペースアイテム関連テーブル
    /// </summary>
    public DbSet<WorkspaceItemRelation> WorkspaceItemRelations { get; set; }

    /// <summary>
    /// スキルテーブル
    /// </summary>
    public DbSet<Skill> Skills { get; set; }

    /// <summary>
    /// ユーザースキルテーブル（中間テーブル）
    /// </summary>
    public DbSet<UserSkill> UserSkills { get; set; }

    /// <summary>
    /// アクティビティ（操作履歴）テーブル
    /// </summary>
    public DbSet<Activity> Activities { get; set; }

    /// <summary>
    /// ワークスペースタスクテーブル
    /// </summary>
    public DbSet<WorkspaceTask> WorkspaceTasks { get; set; }

    /// <summary>
    /// タスクタグテーブル（中間テーブル）
    /// </summary>
    public DbSet<TaskTag> TaskTags { get; set; }

    /// <summary>
    /// タスクコメントテーブル
    /// </summary>
    public DbSet<TaskComment> TaskComments { get; set; }

    /// <summary>
    /// リフレッシュトークンテーブル
    /// </summary>
    public DbSet<RefreshToken> RefreshTokens { get; set; }

    /// <summary>
    /// ユーザー端末（デバイス）テーブル
    /// </summary>
    public DbSet<Device> Devices { get; set; }

    /// <summary>
    /// モデル作成時の設定（リレーションシップ、インデックス等）
    /// </summary>
    /// <param name="modelBuilder">モデルビルダー</param>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Userエンティティの設定
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.LoginId).IsRequired().HasMaxLength(64);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Email).IsRequired().HasMaxLength(254);
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.AvatarType);
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
            entity.Property(e => e.Email).HasMaxLength(254);
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

        // Tagエンティティの設定
        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(50);

            // Tag と Organization の多対一リレーションシップ
            entity
                .HasOne(t => t.Organization)
                .WithMany(o => o.Tags)
                .HasForeignKey(t => t.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            // Tag と CreatedByUser の多対一リレーションシップ
            entity
                .HasOne(t => t.CreatedByUser)
                .WithMany()
                .HasForeignKey(t => t.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // インデックス
            entity.HasIndex(t => new { t.OrganizationId, t.Name }).IsUnique();
            entity.HasIndex(t => t.CreatedByUserId);
        });

        // WorkspaceItemTagエンティティの設定（中間テーブル）
        modelBuilder.Entity<WorkspaceItemTag>(entity =>
        {
            entity.HasKey(wit => new { wit.WorkspaceItemId, wit.TagId });

            // WorkspaceItemTag と WorkspaceItem の多対一リレーションシップ
            entity
                .HasOne(wit => wit.WorkspaceItem)
                .WithMany(wi => wi.WorkspaceItemTags)
                .HasForeignKey(wit => wit.WorkspaceItemId)
                .OnDelete(DeleteBehavior.Cascade);

            // WorkspaceItemTag と Tag の多対一リレーションシップ
            entity
                .HasOne(wit => wit.Tag)
                .WithMany(t => t.WorkspaceItemTags)
                .HasForeignKey(wit => wit.TagId)
                .OnDelete(DeleteBehavior.Cascade);

            // WorkspaceItemTag と CreatedByUser の多対一リレーションシップ
            entity
                .HasOne(wit => wit.CreatedByUser)
                .WithMany()
                .HasForeignKey(wit => wit.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // インデックス
            entity.HasIndex(wit => wit.TagId);
            entity.HasIndex(wit => wit.CreatedByUserId);
        });

        // WorkspaceItemPinエンティティの設定（中間テーブル）
        modelBuilder.Entity<WorkspaceItemPin>(entity =>
        {
            entity.HasKey(wip => new { wip.WorkspaceItemId, wip.UserId });

            // WorkspaceItemPin と WorkspaceItem の多対一リレーションシップ
            entity
                .HasOne(wip => wip.WorkspaceItem)
                .WithMany(wi => wi.WorkspaceItemPins)
                .HasForeignKey(wip => wip.WorkspaceItemId)
                .OnDelete(DeleteBehavior.Cascade);

            // WorkspaceItemPin と User の多対一リレーションシップ
            entity
                .HasOne(wip => wip.User)
                .WithMany(u => u.WorkspaceItemPins)
                .HasForeignKey(wip => wip.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // インデックス
            entity.HasIndex(wip => wip.UserId);
            entity.HasIndex(wip => wip.CreatedAt);
        });

        // WorkspaceItemAttachmentエンティティの設定
        modelBuilder.Entity<WorkspaceItemAttachment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.MimeType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.FilePath).IsRequired().HasMaxLength(500);
            entity.Property(e => e.DownloadUrl).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.ThumbnailMediumPath).HasMaxLength(500);
            entity.Property(e => e.ThumbnailSmallPath).HasMaxLength(500);

            // WorkspaceItemAttachment と WorkspaceItem の多対一リレーションシップ
            entity
                .HasOne(a => a.WorkspaceItem)
                .WithMany(wi => wi.WorkspaceItemAttachments)
                .HasForeignKey(a => a.WorkspaceItemId)
                .OnDelete(DeleteBehavior.Cascade);

            // WorkspaceItemAttachment と UploadedByUser の多対一リレーションシップ
            entity
                .HasOne(a => a.UploadedByUser)
                .WithMany()
                .HasForeignKey(a => a.UploadedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // インデックス
            entity.HasIndex(a => a.WorkspaceItemId);
            entity.HasIndex(a => a.UploadedByUserId);
            entity.HasIndex(a => a.UploadedAt);
        });

        // WorkspaceItemRelationエンティティの設定
        modelBuilder.Entity<WorkspaceItemRelation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RelationType).HasMaxLength(50);

            // テーブル設定とチェック制約
            entity.ToTable(t =>
            {
                t.HasCheckConstraint(
                    "CK_WorkspaceItemRelation_DifferentItems",
                    "from_item_id != to_item_id"
                );
            });

            // WorkspaceItemRelation と FromItem の多対一リレーションシップ
            entity
                .HasOne(r => r.FromItem)
                .WithMany(wi => wi.RelationsFrom)
                .HasForeignKey(r => r.FromItemId)
                .OnDelete(DeleteBehavior.Cascade);

            // WorkspaceItemRelation と ToItem の多対一リレーションシップ
            entity
                .HasOne(r => r.ToItem)
                .WithMany(wi => wi.RelationsTo)
                .HasForeignKey(r => r.ToItemId)
                .OnDelete(DeleteBehavior.Cascade);

            // WorkspaceItemRelation と CreatedByUser の多対一リレーションシップ
            entity
                .HasOne(r => r.CreatedByUser)
                .WithMany()
                .HasForeignKey(r => r.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // インデックス
            entity.HasIndex(r => r.FromItemId);
            entity.HasIndex(r => r.ToItemId);
            entity.HasIndex(r => r.CreatedByUserId);
            entity.HasIndex(r => r.RelationType);
            // 同じ組み合わせの関連を防ぐユニークインデックス
            entity
                .HasIndex(r => new
                {
                    r.FromItemId,
                    r.ToItemId,
                    r.RelationType,
                })
                .IsUnique();
        });

        // Skillエンティティの設定
        modelBuilder.Entity<Skill>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(500);

            // Skill と Organization の多対一リレーションシップ
            entity
                .HasOne(s => s.Organization)
                .WithMany(o => o.Skills)
                .HasForeignKey(s => s.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            // Skill と CreatedByUser の多対一リレーションシップ
            entity
                .HasOne(s => s.CreatedByUser)
                .WithMany()
                .HasForeignKey(s => s.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Skill と UpdatedByUser の多対一リレーションシップ
            entity
                .HasOne(s => s.UpdatedByUser)
                .WithMany()
                .HasForeignKey(s => s.UpdatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // インデックス
            entity.HasIndex(s => new { s.OrganizationId, s.Name }).IsUnique();
            entity.HasIndex(s => s.CreatedByUserId);
            entity.HasIndex(s => s.UpdatedByUserId);
        });

        // UserSkillエンティティの設定（中間テーブル）
        modelBuilder.Entity<UserSkill>(entity =>
        {
            entity.HasKey(us => new { us.UserId, us.SkillId });

            // UserSkill と User の多対一リレーションシップ
            entity
                .HasOne(us => us.User)
                .WithMany(u => u.UserSkills)
                .HasForeignKey(us => us.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // UserSkill と Skill の多対一リレーションシップ
            entity
                .HasOne(us => us.Skill)
                .WithMany(s => s.UserSkills)
                .HasForeignKey(us => us.SkillId)
                .OnDelete(DeleteBehavior.Cascade);

            // UserSkill と AddedByUser の多対一リレーションシップ
            entity
                .HasOne(us => us.AddedByUser)
                .WithMany()
                .HasForeignKey(us => us.AddedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // インデックス
            entity.HasIndex(us => us.SkillId);
            entity.HasIndex(us => us.AddedByUserId);
            entity.HasIndex(us => us.AddedAt);
        });

        // Activityエンティティの設定
        modelBuilder.Entity<Activity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.WorkspaceId).IsRequired();
            entity.Property(e => e.ItemId).IsRequired();
            entity.Property(e => e.Action).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ActionCategory).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CreatedAt).IsRequired();

            // jsonb カラムの設定
            entity.Property(e => e.BeforeData).HasColumnType("jsonb");
            entity.Property(e => e.AfterData).HasColumnType("jsonb");
            entity.Property(e => e.Metadata).HasColumnType("jsonb");

            // Activity と Workspace の多対一リレーションシップ
            entity
                .HasOne(a => a.Workspace)
                .WithMany()
                .HasForeignKey(a => a.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            // Activity と WorkspaceItem の多対一リレーションシップ
            entity
                .HasOne(a => a.Item)
                .WithMany()
                .HasForeignKey(a => a.ItemId)
                .OnDelete(DeleteBehavior.Cascade);

            // Activity と User の多対一リレーションシップ
            entity
                .HasOne(a => a.User)
                .WithMany()
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            // インデックス（統計クエリ最適化用）
            entity.HasIndex(a => a.WorkspaceId);
            entity.HasIndex(a => a.ItemId);
            entity.HasIndex(a => a.UserId);
            entity.HasIndex(a => a.ActionCategory);
            entity.HasIndex(a => a.CreatedAt);
            // 複合インデックス（頻繁な統計クエリ用）
            entity.HasIndex(a => new { a.WorkspaceId, a.CreatedAt });
            entity.HasIndex(a => new { a.ItemId, a.CreatedAt });
            entity.HasIndex(a => new { a.UserId, a.CreatedAt });
        });

        // WorkspaceTaskエンティティの設定
        modelBuilder.Entity<WorkspaceTask>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).IsRequired();
            entity.Property(e => e.TaskType).IsRequired();
            entity.Property(e => e.ProgressPercentage).HasDefaultValue(0);
            entity.Property(e => e.IsCompleted).HasDefaultValue(false);
            entity.Property(e => e.IsDiscarded).HasDefaultValue(false);
            entity.Property(e => e.DiscardReason).HasMaxLength(500);
            entity.Property(e => e.DisplayOrder).HasDefaultValue(0);
            entity.Property(e => e.EstimatedHours).HasPrecision(10, 2);
            entity.Property(e => e.ActualHours).HasPrecision(10, 2);

            // WorkspaceTask と WorkspaceItem の多対一リレーションシップ
            entity
                .HasOne(wt => wt.WorkspaceItem)
                .WithMany()
                .HasForeignKey(wt => wt.WorkspaceItemId)
                .OnDelete(DeleteBehavior.Cascade);

            // WorkspaceTask と Workspace の多対一リレーションシップ
            entity
                .HasOne(wt => wt.Workspace)
                .WithMany()
                .HasForeignKey(wt => wt.WorkspaceId)
                .OnDelete(DeleteBehavior.Cascade);

            // WorkspaceTask と Organization の多対一リレーションシップ
            entity
                .HasOne(wt => wt.Organization)
                .WithMany()
                .HasForeignKey(wt => wt.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            // WorkspaceTask と AssignedUser の多対一リレーションシップ
            entity
                .HasOne(wt => wt.AssignedUser)
                .WithMany()
                .HasForeignKey(wt => wt.AssignedUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // WorkspaceTask と CreatedByUser の多対一リレーションシップ
            entity
                .HasOne(wt => wt.CreatedByUser)
                .WithMany()
                .HasForeignKey(wt => wt.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // インデックス（検索効率化用）
            entity.HasIndex(wt => wt.WorkspaceItemId);
            entity.HasIndex(wt => wt.WorkspaceId);
            entity.HasIndex(wt => wt.OrganizationId);
            entity.HasIndex(wt => wt.AssignedUserId);
            entity.HasIndex(wt => wt.CreatedByUserId);
            entity.HasIndex(wt => wt.IsCompleted);
            entity.HasIndex(wt => wt.IsDiscarded);
            entity.HasIndex(wt => wt.DueDate);
            entity.HasIndex(wt => wt.Priority);
            entity.HasIndex(wt => wt.TaskType);
            entity.HasIndex(wt => wt.DisplayOrder);
            // 複合インデックス（頻繁な検索パターン用）
            entity.HasIndex(wt => new { wt.AssignedUserId, wt.IsCompleted });
            entity.HasIndex(wt => new { wt.WorkspaceId, wt.IsCompleted });
            entity.HasIndex(wt => new { wt.OrganizationId, wt.IsCompleted });
            entity.HasIndex(wt => new { wt.WorkspaceItemId, wt.IsCompleted });
        });

        // TaskTagエンティティの設定（中間テーブル）
        modelBuilder.Entity<TaskTag>(entity =>
        {
            entity.HasKey(tt => new { tt.WorkspaceTaskId, tt.TagId });

            // TaskTag と WorkspaceTask の多対一リレーションシップ
            entity
                .HasOne(tt => tt.WorkspaceTask)
                .WithMany(wt => wt.TaskTags)
                .HasForeignKey(tt => tt.WorkspaceTaskId)
                .OnDelete(DeleteBehavior.Cascade);

            // TaskTag と Tag の多対一リレーションシップ
            entity
                .HasOne(tt => tt.Tag)
                .WithMany()
                .HasForeignKey(tt => tt.TagId)
                .OnDelete(DeleteBehavior.Cascade);

            // TaskTag と CreatedByUser の多対一リレーションシップ
            entity
                .HasOne(tt => tt.CreatedByUser)
                .WithMany()
                .HasForeignKey(tt => tt.CreatedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // インデックス
            entity.HasIndex(tt => tt.TagId);
            entity.HasIndex(tt => tt.CreatedByUserId);
            entity.HasIndex(tt => tt.CreatedAt);
        });

        // TaskCommentエンティティの設定
        modelBuilder.Entity<TaskComment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Content).IsRequired();
            entity.Property(e => e.CommentType).IsRequired().HasMaxLength(50).HasDefaultValue("Normal");
            entity.Property(e => e.IsDeleted).HasDefaultValue(false);

            // TaskComment と WorkspaceTask の多対一リレーションシップ
            entity
                .HasOne(tc => tc.WorkspaceTask)
                .WithMany(wt => wt.TaskComments)
                .HasForeignKey(tc => tc.WorkspaceTaskId)
                .OnDelete(DeleteBehavior.Cascade);

            // TaskComment と User の多対一リレーションシップ
            entity
                .HasOne(tc => tc.User)
                .WithMany()
                .HasForeignKey(tc => tc.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // インデックス
            entity.HasIndex(tc => tc.WorkspaceTaskId);
            entity.HasIndex(tc => tc.UserId);
            entity.HasIndex(tc => tc.CommentType);
            entity.HasIndex(tc => tc.IsDeleted);
            entity.HasIndex(tc => tc.CreatedAt);
        });

        // RefreshTokenエンティティの設定
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Token).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ExpiresAt).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.Property(e => e.IsRevoked).HasDefaultValue(false);

            // RefreshToken と User の多対一リレーションシップ
            entity
                .HasOne(rt => rt.User)
                .WithMany()
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // RefreshToken と Device の多対一リレーションシップ（端末が削除されたら参照をクリア）
            entity
                .HasOne(rt => rt.Device)
                .WithMany(d => d.RefreshTokens)
                .HasForeignKey(rt => rt.DeviceId)
                .OnDelete(DeleteBehavior.SetNull);

            // インデックス（高速検索用）
            entity.HasIndex(rt => rt.Token).IsUnique();
            entity.HasIndex(rt => rt.UserId);
            entity.HasIndex(rt => new { rt.UserId, rt.IsRevoked, rt.ExpiresAt });
        });

        // Deviceエンティティの設定
        modelBuilder.Entity<Device>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PublicId).IsRequired().HasMaxLength(64);
            entity.Property(e => e.HashedIdentifier).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Name).HasMaxLength(200);
            entity.Property(e => e.Client).HasMaxLength(200);
            entity.Property(e => e.AppVersion).HasMaxLength(50);
            entity.Property(e => e.LastIpMasked).HasMaxLength(50);
            entity.Property(e => e.LastSeenLocation).HasMaxLength(200);
            entity.Property(e => e.Timezone).HasMaxLength(100);

            // Device と User の多対一リレーションシップ
            entity
                .HasOne(d => d.User)
                .WithMany(u => u.Devices)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // インデックス
            entity.HasIndex(d => d.PublicId).IsUnique();
            entity.HasIndex(d => d.HashedIdentifier);
            entity.HasIndex(d => d.UserId);
            entity.HasIndex(d => d.LastSeenAt);
        });
    }
}
