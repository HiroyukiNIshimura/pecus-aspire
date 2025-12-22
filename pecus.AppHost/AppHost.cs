using Pecus.Libs;
using Serilog;

// Serilogの初期化（pecus.Libsの共通設定を使用）

if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Production")
    SerilogHelper.CreateLogger("pecus-apphost", SerilogHelper.LogEnvironment.Production);
else
{
    SerilogHelper.CreateLogger("pecus-apphost", SerilogHelper.LogEnvironment.Development);
}

try
{
    var builder = DistributedApplication.CreateBuilder(args);

    // Serilogを使用
    builder.Services.AddSerilog(dispose: true);

    var username = builder.AddParameter("username", secret: true);
    var password = builder.AddParameter("password", secret: true);
    var frontendUrl = builder.AddParameter("frontendUrl");
    var lexicalConverterUrl = builder.AddParameter("lexicalConverterUrl");

    var redis = builder.AddRedis("redis");

    var postgres = builder
            .AddPostgres("postgres", userName: username, password: password, port: 5432)
            .WithImage("groonga/pgroonga", "latest-debian-18")
        .WithVolume("postgres-data", "/var/lib/postgresql");
    var pecusDb = postgres.AddDatabase("pecusdb");

    // WebApi の uploads フォルダの絶対パスを取得
    var webApiProjectPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "pecus.WebApi"));
    var uploadsPath = Path.Combine(webApiProjectPath, "uploads");
    Log.Information("Uploads path: {UploadsPath}", uploadsPath);

    // Protos フォルダの絶対パスを取得
    var protosPath = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "pecus.Protos"));
    var lexicalProtoPath = Path.Combine(protosPath, "lexical", "lexical.proto");
    Log.Information("Lexical proto path: {LexicalProtoPath}", lexicalProtoPath);

    // Lexical Converter (Node.js gRPC Service)
    var lexicalConverter = builder.AddNpmApp("lexicalconverter", "../pecus.LexicalConverter", "start:dev")
        .WithNpmPackageInstallation()
        .WithHttpEndpoint(targetPort: 5100, name: "grpc", isProxied: false)
        .WithEnvironment("GRPC_PORT", "5100")
        .WithEnvironment("GRPC_HOST", "0.0.0.0")
        .WithEnvironment("LEXICAL_PROTO_PATH", lexicalProtoPath);

    //マイグレーションとシードデータの投入サービス
    var dbManager = builder
        .AddProject<Projects.pecus_DbManager>("dbmanager")
        .WithReference(pecusDb)
        .WithReference(lexicalConverter)
        .WaitFor(lexicalConverter)
        .WaitFor(pecusDb);

    var backfire = builder
    .AddProject<Projects.pecus_BackFire>("backfire")
    .WithReference(redis)
    .WithReference(pecusDb)
    .WithReference(lexicalConverter)
    .WaitFor(redis)
    .WaitFor(pecusDb)
    .WaitFor(lexicalConverter)
    .WithEnvironment("UploadsCleanup__UploadsBasePath", uploadsPath)
    .WithEnvironment("Frontend__Endpoint", frontendUrl)
    .WithEnvironment("LexicalConverter__Endpoint", lexicalConverterUrl);

    var pecusApi = builder
        .AddProject<Projects.pecus_WebApi>("pecusapi")
        .WithReference(pecusDb)
        .WithReference(redis)
        .WithReference(lexicalConverter)
        .WaitFor(pecusDb)
        .WaitFor(redis)
        .WaitFor(dbManager)
        .WaitFor(backfire)
        .WaitFor(lexicalConverter)
        .WithExternalHttpEndpoints()
        .WithHttpHealthCheck("/")
        .WithEnvironment("LexicalConverter__Endpoint", lexicalConverterUrl)
        .WithEnvironment("Frontend__Endpoint", frontendUrl);

    // Frontendの設定(開発環境モード)
    var redisFrontend = builder.AddRedis("redisFrontend").WithDbGate();

    var frontend = builder.AddNpmApp("frontend", "../pecus.Frontend", "dev")
        .WithReference(pecusApi)
        .WithReference(redisFrontend)
        .WaitFor(redisFrontend)
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