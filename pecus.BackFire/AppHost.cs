using Hangfire;
using Hangfire.Redis.StackExchange;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);
builder.AddServiceDefaults();
builder.AddRedisClient("redis");

builder.Services.AddHangfire((serviceProvider, config) =>
{
    var redis = serviceProvider.GetRequiredService<IConnectionMultiplexer>();
    config.UseRedisStorage(redis);
});

builder.Services.AddHangfireServer();

var app = builder.Build();
app.Run();
