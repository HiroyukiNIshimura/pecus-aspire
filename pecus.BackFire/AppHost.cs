using Hangfire;
using Hangfire.Redis.StackExchange;
using Pecus.Libs.Hangfire.Tasks;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();
builder.AddRedisClient("redis");

// Hangfireタスクの登録
builder.Services.AddScoped<HangfireTasks>();

//ここでは何もしないHangfireクライアントとジョブを実行するサーバーを登録する
builder.Services.AddHangfire(
    (serviceProvider, config) =>
    {
        var redis = serviceProvider.GetRequiredService<IConnectionMultiplexer>();
        config.UseRedisStorage(redis);
    }
);

builder.Services.AddHangfireServer();

var app = builder.Build();
app.Run();
