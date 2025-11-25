using Pecus.Libs;
using Serilog;

// Serilogの初期化（pecus.Libsの共通設定を使用）
SerilogHelper.CreateLogger("pecus-apphost");

try
{
    var builder = DistributedApplication.CreateBuilder(args);

    // Serilogを使用
    builder.Services.AddSerilog(dispose: true);

    var username = builder.AddParameter("username", secret: true);
    var password = builder.AddParameter("password", secret: true);

    var redis = builder.AddRedis("redis");

    var postgres = builder
        .AddPostgres("postgres", userName: username, password: password, port: 5432)
        .WithDataVolume(isReadOnly: false);
    var pecusDb = postgres.AddDatabase("pecusdb");

    var dbManager = builder
        .AddProject<Projects.pecus_DbManager>("dbmanager")
        .WithReference(pecusDb)
        .WaitFor(pecusDb);

    // WebApi の uploads フォルダの絶対パスを取得
    var webApiProjectPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "pecus.WebApi"));
    var uploadsPath = Path.Combine(webApiProjectPath, "uploads");
    Log.Information("Uploads path: {UploadsPath}", uploadsPath);

    var backfire = builder
    .AddProject<Projects.pecus_BackFire>("backfire")
    .WithReference(redis)
    .WithReference(pecusDb)
    .WaitFor(redis)
    .WaitFor(pecusDb)
    .WithEnvironment("UploadsCleanup__UploadsBasePath", uploadsPath);

    var pecusApi = builder
        .AddProject<Projects.pecus_WebApi>("pecusapi")
        .WithReference(pecusDb)
        .WithReference(redis)
        .WaitFor(pecusDb)
        .WaitFor(redis)
        .WaitFor(dbManager)
        .WaitFor(backfire)
        .WithExternalHttpEndpoints()
        .WithHttpHealthCheck("/");

    var frontend = builder.AddNpmApp("frontend", "../pecus.Frontend", "dev")
        .WithReference(pecusApi)
        .WaitFor(pecusApi)
        .WithNpmPackageInstallation()
        .WithExternalHttpEndpoints();

    builder.Build().Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}