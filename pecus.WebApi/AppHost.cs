using Hangfire;
using Hangfire.Redis.StackExchange;
using Microsoft.AspNetCore.Authentication.JwtBearer;
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
builder.Services.AddSingleton<RefreshTokenService>();
builder.Services.AddSingleton<TokenBlacklistService>();

// Hangfireタスクの登録
builder.Services.AddScoped<HangfireTasks>();
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
        options.TokenValidationParameters = new TokenValidationParameters()
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(pecusConfig.Jwt.IssuerSigningKey)
            ),
            ValidateIssuer = true,
            ValidIssuer = pecusConfig.Jwt.ValidIssuer,
            ValidateAudience = true,
            ValidAudience = pecusConfig.Jwt.ValidAudience,
            RequireExpirationTime = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(pecusConfig.Jwt.ExpiresMinutes),
        };

        // トークン検証時にブラックリストを参照して即時拒否する
        options.Events = new JwtBearerEvents
        {
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

                    if (await blacklist.IsTokenRevokedAsync(userId, iat, jti))
                    {
                        context.Fail("Token has been revoked or invalidated");
                        return;
                    }
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
