using System.Reflection;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using NLog;
using NLog.Web;
using Pecus.DB;
using Pecus.Filters;
using Pecus.Libs;
using Pecus.Models.Config;
using Pecus.Services;

// NLog: Setup the logger first to catch all errors
var logger = LogManager.Setup().LoadConfigurationFromAppSettings().GetCurrentClassLogger();
logger.Debug("init main");

try
{
    var builder = WebApplication.CreateBuilder(args);

    // NLog: Setup NLog for Dependency injection
    builder.Logging.ClearProviders();
    builder.Host.UseNLog();

    // Pecus設定の読み込みと登録
    var pecusConfig =
        builder.Configuration.GetSection("Pecus").Get<PecusConfig>() ?? new PecusConfig();
    builder.Services.AddSingleton(pecusConfig);

    // JwtBearerUtilを初期化
    JwtBearerUtil.Initialize(pecusConfig);

    // Add services to the container.

    // DbContextの登録
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
    );

    // サービスの登録
    builder.Services.AddScoped<UserService>();
    builder.Services.AddScoped<RoleService>();
    builder.Services.AddScoped<PermissionService>();
    builder.Services.AddScoped<OrganizationService>();
    builder.Services.AddScoped<WorkspaceService>();
    builder.Services.AddScoped<GenreService>();
    builder.Services.AddScoped<FileUploadService>();

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
                Description = "ユーザー、ロール、権限管理のためのAPI",
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

    app.Run();
}
catch (Exception exception)
{
    // NLog: catch setup errors
    logger.Error(exception, "Stopped program because of exception");
    throw;
}
finally
{
    // Ensure to flush and stop internal timers/threads before application-exit (Avoid segmentation fault on Linux)
    LogManager.Shutdown();
}
