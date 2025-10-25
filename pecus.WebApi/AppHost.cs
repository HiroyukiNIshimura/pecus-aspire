using System.Reflection;
using System.Text;
using Hangfire;
using Hangfire.Redis.StackExchange;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Pecus.Filters;
using Pecus.Libs;
using Pecus.Libs.DB;
using Pecus.Libs.Hangfire.Tasks;
using Pecus.Models.Config;
using Pecus.Services;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Aspire Service Defaults (Serilog含む)
builder.AddServiceDefaults();

// Pecus設定の読み込みと登録
var pecusConfig = builder.Configuration.GetSection("Pecus").Get<PecusConfig>() ?? new PecusConfig();
builder.Services.AddSingleton(pecusConfig);

// JwtBearerUtilを初期化
JwtBearerUtil.Initialize(pecusConfig);

// Add services to the container.

// DbContextの登録 - Aspireの接続文字列を使用
builder.AddNpgsqlDbContext<ApplicationDbContext>("pecusdb");

// サービスの登録
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<RoleService>();
builder.Services.AddScoped<PermissionService>();
builder.Services.AddScoped<OrganizationService>();
builder.Services.AddScoped<WorkspaceService>();
builder.Services.AddScoped<WorkspaceItemService>();
builder.Services.AddScoped<GenreService>();
builder.Services.AddScoped<FileUploadService>();
builder.Services.AddScoped<TagService>();

// Hangfireタスクの登録
builder.Services.AddScoped<HangfireTasks>();

// Redisクライアントの設定（Aspireから取得）
builder.AddRedisClient("redis");

// Hangfireの設定
builder.Services.AddHangfire(
    (serviceProvider, configuration) =>
    {
        var redisConnection = serviceProvider.GetRequiredService<IConnectionMultiplexer>();
        configuration
            .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
            .UseSimpleAssemblyNameTypeSerializer()
            .UseRecommendedSerializerSettings()
            .UseRedisStorage(redisConnection);
    }
);

// Hangfireサーバーの追加
builder.Services.AddHangfireServer();

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
            ClockSkew = TimeSpan.FromHours(pecusConfig.Jwt.ExpiresHours),
        };
    });

builder.Services.AddControllers(options =>
{
    // 共通の検証フィルターを追加
    options.Filters.Add<ValidationFilter>();
    // グローバル認証ポリシーを追加
    options.Filters.Add(new Microsoft.AspNetCore.Mvc.Authorization.AuthorizeFilter());
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

// Hangfireダッシュボード（開発環境のみ）
if (app.Environment.IsDevelopment())
{
    app.UseHangfireDashboard(
        "/hangfire",
        new DashboardOptions
        {
            Authorization = new[] { new AllowAllDashboardAuthorizationFilter() },
        }
    );
}

app.MapControllers();
app.MapDefaultEndpoints();

app.Run();
