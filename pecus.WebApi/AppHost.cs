using Hangfire;
using Hangfire.Redis.StackExchange;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Pecus.Filters;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Libs.Mail.Configuration;
using Pecus.Libs.Mail.Services;
using Pecus.Models.Config;
using Pecus.Services;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// Aspire Service Defaults (Serilog含む)
builder.AddServiceDefaults();

// Pecus設定の読み込みと登録
var pecusConfig = builder.Configuration.GetSection("Pecus").Get<PecusConfig>() ?? new PecusConfig();
builder.Services.AddSingleton(pecusConfig);

// JwtBearerUtilを初期化
JwtBearerUtil.Initialize(pecusConfig);

// HttpContextAccessorを追加（動的BaseUrl取得用）
builder.Services.AddHttpContextAccessor();

// Add services to the container.

// DbContextの登録 - Aspireの接続文字列を使用
builder.AddNpgsqlDbContext<ApplicationDbContext>("pecusdb");
// ExecutionStrategyをNonRetryingExecutionStrategyに置き換え
builder.Services.ConfigureDbContext<ApplicationDbContext>(options =>
{
    // NpgsqlRetryingExecutionStrategyを無効化してNonRetryingExecutionStrategyを使用
    options.ReplaceService<Microsoft.EntityFrameworkCore.Storage.IExecutionStrategy, Microsoft.EntityFrameworkCore.Storage.NonRetryingExecutionStrategy>();
});
// EmailSettings設定
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));

// メール関連サービスの登録
builder.Services.AddScoped<ITemplateService, RazorTemplateService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Redisキャッシュの登録
builder.AddRedisClient("redis");
builder.Services.AddMemoryCache(); // 分散キャッシュとして

// ヘルパーの登録
builder.Services.AddScoped<OrganizationAccessHelper>();

// サービスの登録
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<ProfileService>();
builder.Services.AddScoped<RoleService>();
builder.Services.AddScoped<PermissionService>();
builder.Services.AddScoped<OrganizationService>();
builder.Services.AddScoped<WorkspaceService>();
builder.Services.AddScoped<WorkspaceItemService>();
builder.Services.AddScoped<WorkspaceItemAttachmentService>();
builder.Services.AddScoped<WorkspaceItemPinService>();
builder.Services.AddScoped<WorkspaceItemTagService>();
builder.Services.AddScoped<WorkspaceItemRelationService>();
builder.Services.AddScoped<GenreService>();
builder.Services.AddScoped<FileUploadService>();
builder.Services.AddScoped<TagService>();
builder.Services.AddScoped<SkillService>();
builder.Services.AddScoped<MasterDataService>();

// トークン管理サービス（プロトタイプ、メモリキャッシュベース）
builder.Services.AddScoped<RefreshTokenService>();
builder.Services.AddSingleton<TokenBlacklistService>();

// Hangfireタスクの登録
builder.Services.AddScoped<HangfireTasks>();
builder.Services.AddScoped<EmailTasks>();
builder.Services.AddScoped<ImageTasks>();

// Hangfireの設定
builder.Services.AddHangfire(
    (serviceProvider, configuration) =>
    {
        var redis = builder.Configuration.GetConnectionString("redis");
        configuration
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UseRedisStorage(redis, new RedisStorageOptions { Prefix = "hangfire:" });
    }
);

builder
    .Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;

        // 環境変数から取得、なければ appsettings.json から
        var signingKey = Environment.GetEnvironmentVariable("JWT_SECRET")
                         ?? pecusConfig.Jwt.IssuerSigningKey;

        // キーの長さ検証（最低32バイト）
        var keyBytes = Encoding.UTF8.GetBytes(signingKey);
        if (keyBytes.Length < 32)
        {
            throw new InvalidOperationException(
                $"JWT署名キーが短すぎます（現在: {keyBytes.Length}バイト、最低: 32バイト）。" +
                "appsettings.json の Pecus:Jwt:IssuerSigningKey を64文字以上の文字列に変更してください。"
            );
        }

        options.TokenValidationParameters = new TokenValidationParameters()
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(keyBytes),
            ValidateIssuer = true,
            ValidIssuer = pecusConfig.Jwt.ValidIssuer,
            ValidateAudience = true,
            ValidAudience = pecusConfig.Jwt.ValidAudience,
            RequireExpirationTime = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(pecusConfig.Jwt.ExpiresMinutes),
        };

        // トークン検証時にブラックリストを参照して即時拒否する（ログを追加）
        options.Events = new JwtBearerEvents
        {
            // リクエスト受信時にトークンヘッダーの有無やリクエストパスをログ出力
            OnMessageReceived = context =>
            {
                try
                {
                    var logger = context.HttpContext.RequestServices.GetService<ILoggerFactory>()?.CreateLogger("JwtBearerEvents");
                    var hasAuthHeader = context.Request.Headers.ContainsKey("Authorization");
                    logger?.LogDebug("JwtBearer: MessageReceived Path={Path} HasAuthorizationHeader={HasAuth}", context.HttpContext.Request.Path, hasAuthHeader);
                }
                catch { /* ログ失敗してもトークン処理は継続 */ }

                return Task.CompletedTask;
            },

            // 認証失敗時に例外情報を詳細ログとして残す
            OnAuthenticationFailed = context =>
            {
                try
                {
                    var logger = context.HttpContext.RequestServices.GetService<ILoggerFactory>()?.CreateLogger("JwtBearerEvents");
                    logger?.LogError(context.Exception, "JwtBearer: Authentication failed for request {Path}", context.HttpContext.Request.Path);
                }
                catch { /* ログ失敗時は無視 */ }

                return Task.CompletedTask;
            },

            // 認可チャレンジが発生した際のログ
            OnChallenge = context =>
            {
                try
                {
                    var logger = context.HttpContext.RequestServices.GetService<ILoggerFactory>()?.CreateLogger("JwtBearerEvents");
                    logger?.LogWarning("JwtBearer: Challenge triggered. Error={Error}, Description={Desc}, Path={Path}", context.Error, context.ErrorDescription, context.HttpContext.Request.Path);
                }
                catch { }

                return Task.CompletedTask;
            },

            // トークン検証成功時でもブラックリストチェックの結果や例外はログ出力
            OnTokenValidated = async context =>
            {
                try
                {
                    var principal = context.Principal;
                    if (principal == null)
                    {
                        context.Fail("Invalid principal");
                        return;
                    }

                    // JTI と発行時刻を取得して、Redis 側でまとめて無効化チェックを実行
                    var jti = JwtBearerUtil.GetJtiFromPrincipal(principal);
                    var userId = JwtBearerUtil.GetUserIdFromPrincipal(principal);
                    var iat = JwtBearerUtil.GetIssuedAtFromPrincipal(principal);
                    var blacklist = context.HttpContext.RequestServices.GetRequiredService<TokenBlacklistService>();

                    var logger = context.HttpContext.RequestServices.GetService<ILoggerFactory>()?.CreateLogger("JwtBearerEvents");
                    if (await blacklist.IsTokenRevokedAsync(userId, iat, jti))
                    {
                        logger?.LogInformation("JwtBearer: Token revoked. UserId={UserId} Jti={Jti} Iat={Iat}", userId, jti, iat);
                        context.Fail("Token has been revoked or invalidated");
                        return;
                    }

                    // ユーザーが無効な場合はトークンを拒否
                    var dbContext = context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
                    var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
                    if (user == null || !user.IsActive)
                    {
                        logger?.LogInformation("JwtBearer: User is inactive or not found. UserId={UserId}", userId);
                        context.Fail("User is inactive or not found");
                        return;
                    }

                    logger?.LogDebug("JwtBearer: Token validated. UserId={UserId} Jti={Jti} Iat={Iat}", userId, jti, iat);
                }
                catch (Exception ex)
                {
                    var logger = context.HttpContext.RequestServices.GetService<ILoggerFactory>()?.CreateLogger("JwtBearerEvents");
                    logger?.LogError(ex, "Error during token validation events");
                    context.Fail("Token validation error");
                }
            }
        };
    });

builder.Services.AddControllers(options =>
{
    // グローバル例外ハンドリングフィルターを追加
    options.Filters.Add<GlobalExceptionFilter>();
    // 共通の検証フィルターを追加
    options.Filters.Add<ValidationFilter>();
    // グローバル認証ポリシーを追加
    options.Filters.Add(new Microsoft.AspNetCore.Mvc.Authorization.AuthorizeFilter());
}).AddJsonOptions(opts =>
    {
        // レスポンスは camelCase（先頭小文字）でシリアライズ
        opts.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        // リクエスト側は大文字小文字を無視してマッピング（PascalCase のプロパティ名も許可）
        opts.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        // Enumを文字列としてシリアライズ/デシリアライズ
        opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Swagger/OpenAPIの設定
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = pecusConfig.Application.Name,
            Version = pecusConfig.Application.Version,
            Description = "AIを社畜扱いして作成するWebAPIです。",
        }
    );
    options.AddSecurityDefinition(
        "bearerAuth",
        new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "JWT Authorization header using the Bearer scheme.",
        }
    );
    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "bearerAuth",
                    },
                },
                new string[] { }
            },
        }
    );

    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFilename));
});

// HttpLoggingの設定
builder.Services.AddHttpLogging(logging =>
{
    logging.LoggingFields = Microsoft.AspNetCore.HttpLogging.HttpLoggingFields.All;
    logging.RequestBodyLogLimit = 4096;
    logging.ResponseBodyLogLimit = 4096;
});

//-------------
var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint(
            "/swagger/v1/swagger.json",
            $"{pecusConfig.Application.Name} {pecusConfig.Application.Version}"
        );
        options.RoutePrefix = string.Empty;
    });
}

app.UseHttpLogging();
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapDefaultEndpoints();

app.Run();
