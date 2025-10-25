# Pecus Aspire - AI Agent Instructions

## Project Philosophy
**Conversation-Driven Development**: Built entirely through AI pair programming. Solve problems through iteration, not speculation. The codebase has evolved from a standalone API to a distributed microservices architecture using .NET Aspire.

## Architecture Overview

### .NET Aspire Distributed Application
This is a **microservices project orchestrated by .NET Aspire 9.0**, not a monolithic application.

**Project Structure**:
- **pecus.AppHost**: Aspire orchestration host - defines service topology, dependencies, and startup order
- **pecus.WebApi**: Main REST API with JWT auth, Hangfire client, Swagger UI
- **pecus.BackFire**: Hangfire background job server (worker process)
- **pecus.DbManager**: Database migration manager - auto-migrates on startup, provides manual endpoints
- **pecus.Libs**: Shared class library for DB models, Hangfire tasks, seed data
- **pecus.ServiceDefaults**: Aspire service defaults (health checks, telemetry)

**Infrastructure** (defined in `pecus.AppHost/AppHost.cs`):
- **PostgreSQL**: `pecusdb` database with username/password parameters
- **Redis**: Shared cache for Hangfire job queue
- **Service Dependencies**: DbManager waits for Postgres, WebApi waits for Postgres+Redis, BackFire waits for Redis

### Data Layer Architecture (pecus.Libs)
**Namespace**: `Pecus.Libs.DB` (migrated from `Pecus.DB` in pecus.WebApi)

**Entities** (`pecus.Libs/DB/Models/*.cs`):
- User, Role, Permission (RBAC with M:N)
- Organization, Workspace, WorkspaceUser (multi-tenant structure)
- Genre (master data for workspace types)

**DbContext** (`pecus.Libs/DB/ApplicationDbContext.cs`):
- EF Core 9.0 with PostgreSQL provider
- Registered via Aspire: `builder.AddNpgsqlDbContext<ApplicationDbContext>("pecusdb")`
- All relationship configurations in `OnModelCreating`

**Seed Data** (`pecus.Libs/DB/Seed/DatabaseSeeder.cs`):
- `SeedAllAsync(bool isDevelopment)`: Environment-aware seeding
  - **Production**: Permissions (13), Roles (Admin/User), Genres (6) only
  - **Development**: Above + Organizations, Users (admin/user123), Workspaces
- `SeedDevelopmentDataAsync()`: Explicitly seed mock data only

### Background Jobs Architecture (Hangfire with Redis)
**Shared Tasks** (`pecus.Libs/Hangfire/Tasks/HangfireTasks.cs`):
- 8 task methods: LogMessage, LongRunningTask, ThrowError, ProcessBatch, SendEmail, GenerateReport, CleanupOldData, HealthCheck
- Registered in DI as `AddScoped<HangfireTasks>()` in both WebApi and BackFire

**Client** (pecus.WebApi):
- Enqueues jobs via `BackgroundJob.Enqueue<HangfireTasks>(x => x.MethodName(...))`
- Dashboard at `/hangfire` (dev only) with `AllowAllDashboardAuthorizationFilter`
- Test endpoints in `Controllers/HangfireTestController.cs`

**Server** (pecus.BackFire):
- Executes jobs from Redis queue
- No controllers, just `AddHangfireServer()` + task registration

**CRITICAL**: Use type parameters in `BackgroundJob.Enqueue<T>()` for cross-project serialization. Lambda closures in loops require local variable copies.

### Database Migration Strategy (pecus.DbManager)
**Auto-Migration on Startup** (`AppHost.cs`):
```csharp
// Startup code in pecus.DbManager/AppHost.cs
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await context.Database.MigrateAsync();  // Apply pending migrations
    
    var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
    await seeder.SeedAllAsync(app.Environment.IsDevelopment());  // Environment-aware seed
}
```

**Manual Endpoints** (`Controllers/DatabaseController.cs`):
- `POST /api/database/reset`: Drop + recreate + migrate + seed (DANGEROUS)
- `POST /api/database/migrate`: Apply pending migrations + seed missing data
- `GET /api/database/status`: Migration history, data statistics
- `POST /api/database/seed?isDevelopment=true`: Manual seeding with environment override
- `POST /api/database/seed/development`: Explicitly seed mock data only

**Entry Point**: File is named `AppHost.cs` (not `Program.cs`) for consistency with pecus.AppHost project structure.

## Critical Patterns

### 1. Aspire Service Registration
**Connection String Pattern**: Services use Aspire-provided connection names:
```csharp
// In project files (WebApi, DbManager)
builder.AddNpgsqlDbContext<ApplicationDbContext>("pecusdb");  // NOT a connection string!
builder.AddRedisClient("redis");                               // Uses Aspire-provided config

// In orchestrator (AppHost/AppHost.cs)
var pecusDb = postgres.AddDatabase("pecusdb");                // Defines "pecusdb" resource
var redis = builder.AddRedis("redis");                        // Defines "redis" resource
```

**Service References**: Use `.WithReference()` and `.WaitFor()`:
```csharp
var pecusApi = builder.AddProject<Projects.pecus_WebApi>("pecusapi")
    .WithReference(pecusDb)      // Injects connection string
    .WithReference(redis)
    .WaitFor(pecusDb)            // Startup dependency
    .WaitFor(redis)
    .WithHttpHealthCheck("/");   // Health check endpoint
```

### 2. Request DTO Pattern (WebApi Layer)
**All service methods accept request objects** (see existing `.github/copilot-instructions.md` in pecus.WebApi for details):
```csharp
// ✅ CORRECT
public async Task<User> CreateUserAsync(CreateUserRequest request, int? createdByUserId = null)

// ❌ WRONG
public async Task<User> CreateUserAsync(string username, string email, ...)
```

### 3. Typed Exception Handling (WebApi Layer)
Use custom exceptions (`Exceptions/NotFoundException.cs`, `Exceptions/DuplicateException.cs`) instead of message inspection. See pecus.WebApi instructions for full pattern.

### 4. Hangfire Task Sharing Pattern
**Tasks must be in shared library** to be callable from WebApi and executable in BackFire:
```csharp
// pecus.Libs/Hangfire/Tasks/HangfireTasks.cs
public class HangfireTasks
{
    public void TaskMethod(string param) { /* implementation */ }
}

// pecus.WebApi controller
BackgroundJob.Enqueue<HangfireTasks>(x => x.TaskMethod(localVariable));  // Type parameter required

// pecus.BackFire AppHost.cs
builder.Services.AddScoped<HangfireTasks>();  // Must register in worker
```

**Loop Variable Capture**: Always copy to local variable before lambda:
```csharp
for (int i = 0; i < items.Count; i++)
{
    var item = items[i];  // Local copy required
    BackgroundJob.Enqueue<HangfireTasks>(x => x.ProcessItem(item));
}
```

### 5. Environment-Aware Seeding
**DatabaseSeeder checks environment** via `IWebHostEnvironment.IsDevelopment()`:
- Production deploys: Only master data (Permissions, Roles, Genres)
- Development: Master data + mock data (sample Org, Users, Workspaces)
- Manual override: `/api/database/seed?isDevelopment=true` forces dev seed in production

### 6. Migration File Location
**EF Core migrations live in pecus.WebApi** (historical reasons - project started as monolith):
```bash
cd pecus.WebApi
dotnet ef migrations add MigrationName
dotnet ef database update  # Dev only - use DbManager in production
```

Despite migrations being in WebApi, pecus.DbManager and pecus.BackFire can execute them because they reference pecus.Libs which contains the DbContext.

## Development Workflow

### Running the Application
```bash
# Start all services via Aspire
dotnet run --project pecus.AppHost

# Or use VS Code launch configuration
# Opens Aspire Dashboard at http://localhost:15000 (or similar)
# Dashboard shows: pecusapi, backfire, dbmanager, postgres, redis
```

**Service Startup Order** (defined by `.WaitFor()`):
1. PostgreSQL + Redis start
2. DbManager starts, applies migrations, seeds data
3. WebApi + BackFire start after dependencies ready

### Accessing Services
- **WebApi Swagger**: Check Aspire Dashboard for dynamically assigned port (e.g., `https://localhost:7123`)
- **Hangfire Dashboard**: `{WebApi URL}/hangfire` (dev only)
- **DbManager API**: Check Aspire Dashboard for port
- **Aspire Dashboard**: Displayed in console output when starting AppHost

### Adding a Migration
```bash
cd pecus.WebApi
dotnet ef migrations add MigrationName
# Migration will auto-apply on next DbManager startup
```

### Testing Background Jobs
1. Start application via `pecus.AppHost`
2. Open WebApi Swagger UI
3. Use `HangfireTestController` endpoints to enqueue jobs
4. Check BackFire logs in Aspire Dashboard to see execution

### Service Registration Order (Within Projects)
**Critical in pecus.WebApi** - services must register in dependency order:
```csharp
// Program.cs/AppHost.cs
builder.Services.AddScoped<UserService>();          // Base
builder.Services.AddScoped<OrganizationService>();  // Depends on UserService
builder.Services.AddScoped<WorkspaceService>();     // Depends on Organization
// etc.
```

## Common Tasks

### Adding a New Microservice
1. **Create Project**: `dotnet new web -n pecus.NewService`
2. **Add to Solution**: `dotnet sln add pecus.NewService`
3. **Reference Libs**: `dotnet add pecus.NewService reference pecus.Libs`
4. **Register in AppHost**:
   ```csharp
   var newService = builder.AddProject<Projects.pecus_NewService>("newservice")
       .WithReference(pecusDb)  // If needs DB
       .WaitFor(pecusDb);
   ```
5. **Add Service Defaults** (optional): `builder.AddServiceDefaults();`

### Sharing Code Between Services
**Always use pecus.Libs** - never reference one service project from another:
- DB models, DbContext → `pecus.Libs/DB/`
- Background job tasks → `pecus.Libs/Hangfire/Tasks/`
- Shared utilities → `pecus.Libs/` (e.g., `CodeGenerator.cs`, `JwtBearerUtil.cs`)

### Adding a Hangfire Task
1. **Add method to `HangfireTasks.cs`** in pecus.Libs
2. **Build solution** (ensures BackFire sees new task)
3. **Enqueue from WebApi**: `BackgroundJob.Enqueue<HangfireTasks>(x => x.NewTask(...))`
4. **No changes needed in BackFire** (auto-discovers via DI)

### Adding a Database Entity
1. **Entity**: Create in `pecus.Libs/DB/Models/`
2. **DbContext**: Add `DbSet<T>` to `ApplicationDbContext.cs`
3. **Migration**: `cd pecus.WebApi && dotnet ef migrations add AddEntity`
4. **Seed Data** (optional): Add method to `DatabaseSeeder.cs`
5. **Services/Controllers**: Implement in pecus.WebApi (see WebApi instructions)

### Modifying Seed Data
**Edit `pecus.Libs/DB/Seed/DatabaseSeeder.cs`**:
- Master data (production): Modify `SeedPermissionsAsync`, `SeedRolesAsync`, `SeedGenresAsync`
- Mock data (development): Modify `SeedDevelopmentDataAsync`, `SeedOrganizationsAsync`, `SeedUsersAsync`, `SeedWorkspacesAsync`

**Testing**: Delete DB (via DbManager `/reset` endpoint) and restart to see changes.

## Anti-Patterns to Avoid
- ❌ Direct service-to-service project references (use pecus.Libs for sharing)
- ❌ Connection strings in service projects (use Aspire resource names: `"pecusdb"`, `"redis"`)
- ❌ Hangfire tasks in controller files (must be in pecus.Libs for BackFire to execute)
- ❌ Lambda closures over loop variables without local copy (Hangfire serialization fails)
- ❌ Manual `Database.Migrate()` in WebApi (use pecus.DbManager for migrations)
- ❌ Hard-coded service URLs (Aspire handles service discovery)
- ❌ Seed data in migration files (use DatabaseSeeder for idempotent seeding)

## Key Files Reference
- **pecus.AppHost/AppHost.cs**: Service topology, infrastructure resources, startup order
- **pecus.Libs/DB/ApplicationDbContext.cs**: Shared DbContext for all services
- **pecus.Libs/DB/Seed/DatabaseSeeder.cs**: Environment-aware seed data management
- **pecus.Libs/Hangfire/Tasks/HangfireTasks.cs**: Background job implementations
- **pecus.WebApi/AppHost.cs**: WebApi service configuration (JWT, Hangfire client, Swagger)
- **pecus.BackFire/AppHost.cs**: Hangfire server configuration
- **pecus.DbManager/AppHost.cs**: Auto-migration on startup + manual endpoints
- **pecus.DbManager/Controllers/DatabaseController.cs**: Migration/seed API endpoints
- **pecus.WebApi/.github/copilot-instructions.md**: Detailed WebApi patterns (request DTOs, auth, exceptions)

## Project-Specific Conventions
1. **Service entry points named `AppHost.cs`** (not `Program.cs`) for consistency
2. **Aspire resource names lowercase**: `"pecusdb"`, `"redis"`, `"pecusapi"`, etc.
3. **All services reference pecus.Libs**, never each other
4. **JWT auth in WebApi only** (BackFire/DbManager are internal services)
5. **Seed data environment-aware**: Master data always, mock data only in dev
6. **Migrations in pecus.WebApi**, executed by pecus.DbManager

## Questions to Clarify
When implementing features across services:
- Which service owns this functionality? (API in WebApi, background processing in BackFire, DB setup in DbManager)
- Does this require shared code? (Add to pecus.Libs)
- Should this be a background job? (Add task to HangfireTasks.cs)
- Is this environment-specific? (Check `IsDevelopment()`)
- What are the Aspire dependencies? (Database? Redis? Other services?)
