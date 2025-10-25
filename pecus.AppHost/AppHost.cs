using Serilog;
using Serilog.Events;

// Serilogの初期化
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Aspire.Hosting.Dcp", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}"
    )
    .WriteTo.File(
        path: "logs/pecus-apphost-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 7,
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}"
    )
    .CreateLogger();

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

    var backfire = builder
        .AddProject<Projects.pecus_BackFire>("backfire")
        .WithReference(redis)
        .WaitFor(redis);

    var pecusApi = builder
        .AddProject<Projects.pecus_WebApi>("pecusapi")
        .WithReference(pecusDb)
        .WithReference(redis)
        .WaitFor(pecusDb)
        .WaitFor(redis)
        .WithHttpHealthCheck("/");

    var dbManager = builder
        .AddProject<Projects.pecus_DbManager>("dbmanager")
        .WithReference(pecusDb)
        .WaitFor(pecusDb);

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
