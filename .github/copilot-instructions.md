# Pecus Aspire - AI Agent Instructions

## Project Philosophy
**Conversation-Driven Development**: Built entirely through AI pair programming. Solve problems through iteration, not speculation. The codebase has evolved from a standalone API to a distributed microservices architecture using .NET Aspire.

## Architecture Overview

### .NET Aspire Distributed Application
This is a **microservices project orchestrated by .NET Aspire 9.0**, not a monolithic application.

**Project Structure**:
- **pecus.AppHost**: Aspire orchestration host - defines service topology, dependencies, and startup order
- **pecus.WebApi**: Main REST API with JWT auth, Hangfire client, Swagger UI
- **pecus.BackFire**: Hangfire background job server (worker process) - executes email tasks and other background jobs
- **pecus.DbManager**: Database migration manager - auto-migrates on startup via `DbInitializer`
- **pecus.Libs**: Shared class library for DB models, Hangfire tasks, email services, seed data
- **pecus.ServiceDefaults**: Aspire service defaults (Serilog, health checks, OpenTelemetry)

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
**Shared Tasks** (`pecus.Libs/Hangfire/Tasks/`):
- `HangfireTasks.cs`: 8 general task methods (LogMessage, LongRunningTask, ThrowError, ProcessBatch, SendEmail, GenerateReport, CleanupOldData, HealthCheck)
- `EmailTasks.cs`: Email-specific tasks using MailKit + RazorLight templates
  - `SendSimpleEmailAsync`: Direct HTML/text email
  - `SendTemplatedEmailAsync<TModel>`: Single recipient with Razor template
  - `SendCustomTemplatedEmailAsync<TModel>`: Multiple recipients, attachments, custom headers
  - `SendBulkTemplatedEmailAsync<TModel>`: Same content to multiple recipients
  - `SendPersonalizedBulkEmailAsync<TModel>`: Different models per recipient
- Registered in DI as `AddScoped<HangfireTasks>()` and `AddScoped<EmailTasks>()` in both WebApi and BackFire

**Client** (pecus.WebApi):
- Enqueues jobs via `BackgroundJob.Enqueue<HangfireTasks>(x => x.MethodName(...))`
- **Uses DI-injected operation classes**: All task classes are registered in DI container and resolved automatically by Hangfire
- Dashboard at `/hangfire` (dev only) with `AllowAllDashboardAuthorizationFilter`
- Test endpoints in `Controllers/HangfireTestController.cs`

**Server** (pecus.BackFire):
- Executes jobs from Redis queue
- **Uses DI-injected operation classes**: Task classes are resolved from DI container during job execution
- No controllers, just `AddHangfireServer()` + task registration

**CRITICAL**:
- Use type parameters in `BackgroundJob.Enqueue<T>()` for cross-project serialization
- **All task classes must be registered in DI** in both WebApi (client) and BackFire (server)
- Lambda closures in loops require local variable copies
- Hangfire automatically resolves dependencies (DbContext, services, etc.) for task classes via DI

### Database Migration Strategy (pecus.DbManager)
**Auto-Migration on Startup** (`DbInitializer.cs`):
```csharp
// Startup code in pecus.DbManager/DbInitializer.cs (IHostedService)
public async Task StartAsync(CancellationToken cancellationToken)
{
    await _context.Database.MigrateAsync(cancellationToken);  // Apply pending migrations
    await _seeder.SeedAllAsync(_environment.IsDevelopment());  // Environment-aware seed
}
```

**Manual Endpoints** (`/reset-db` in AppHost.cs):
- `POST /reset-db` (dev only): Drop + recreate + migrate + seed - endpoint in AppHost.cs, not controller

**Entry Point**: File is named `AppHost.cs` (not `Program.cs`) for consistency with pecus.AppHost project structure.

## Controller Organization (WebApi Layer)

### Endpoint Placement Strategy
**Controllers are organized by access level and purpose**:

**Directory Structure**:
- **`Controllers/`**: Standard authenticated endpoints for logged-in users
  - Example: `UserController`, `WorkspaceController`, `TagController`
  - Access: Requires JWT authentication (`[Authorize]` filter applied globally)
  - Use case: Regular user operations (CRUD on own data, organization-scoped resources)

- **`Controllers/Admin/`**: Organization administrator endpoints
  - Example: `AdminUserController`, `AdminOrganizationController`
  - Access: Requires JWT authentication + organization admin role
  - Use case: Organization management, user administration, billing settings

- **`Controllers/Backend/`**: Internal backend service endpoints
  - Example: `BackendJobController`, `BackendNotificationController`
  - Access: Internal service authentication (API keys, service tokens)
  - Use case: Inter-service communication, Hangfire callbacks, system integrations

- **`Controllers/Entrance/`**: Public/unauthenticated endpoints
  - Example: `EntranceAuthController`, `EntranceRegistrationController`
  - Access: No authentication required (`[AllowAnonymous]`)
  - Use case: Login, registration, password reset, public pages

**Placement Guidelines**:
1. **Default to `Controllers/`**: If endpoint requires authentication and is for general users, place in root
2. **Use `Admin/` for privileged operations**: User management, organization settings, role assignments
3. **Use `Backend/` for service-to-service**: Never expose to public clients, use strong authentication
4. **Use `Entrance/` for pre-auth flows**: Registration, login, password reset, email verification

**Example**:
```csharp
// ✅ CORRECT - Regular user endpoint in Controllers/
// Controllers/WorkspaceController.cs
[ApiController]
[Route("api/workspaces")]
public class WorkspaceController : ControllerBase
{
    // GET /api/workspaces - List user's workspaces
}

// ✅ CORRECT - Admin endpoint in Controllers/Admin/
// Controllers/Admin/AdminUserController.cs
[ApiController]
[Route("api/admin/users")]
public class AdminUserController : ControllerBase
{
    // GET /api/admin/users - List all users in organization (admin only)
}

// ✅ CORRECT - Backend endpoint in Controllers/Backend/
// Controllers/Backend/BackendJobController.cs
[ApiController]
[Route("api/backend/jobs")]
public class BackendJobController : ControllerBase
{
    // POST /api/backend/jobs/webhook - Hangfire webhook callback
}

// ✅ CORRECT - Public endpoint in Controllers/Entrance/
// Controllers/Entrance/EntranceAuthController.cs
[ApiController]
[Route("api/entrance/auth")]
[AllowAnonymous]
public class EntranceAuthController : ControllerBase
{
    // POST /api/entrance/auth/login - User login
}
```

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

**Pagination Pattern**:
- Page number (`page`) is accepted from client as query parameter
- Page size (`pageSize`) is **NOT** accepted from client - always use server-defined default (e.g., 20)
- This prevents clients from requesting excessive data and ensures consistent API performance

```csharp
// ✅ CORRECT - pageSize is hardcoded
[HttpGet]
public async Task<Results<...>> GetItems([FromQuery] int page = 1)
{
    var pageSize = _config.Pagination.DefaultPageSize;  // Server-defined
    var (items, totalCount) = await _service.GetItemsAsync(page, pageSize);
}

// ❌ WRONG - accepting pageSize from client
[HttpGet]
public async Task<Results<...>> GetItems([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
```

### 3. Typed Exception Handling (WebApi Layer)
Use custom exceptions (`Exceptions/NotFoundException.cs`, `Exceptions/DuplicateException.cs`) instead of message inspection. See pecus.WebApi instructions for full pattern.

### 3.5. Authentication and Workspace Access Control (WebApi Layer)
**CRITICAL: Proper authentication and authorization patterns must be followed**:

**User ID Retrieval Pattern**:
```csharp
// ✅ CORRECT - Direct retrieval (global [Authorize] filter ensures authentication)
var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);

// ❌ WRONG - Unnecessary authentication check in controller action
int? userId = null;
if (User.Identity?.IsAuthenticated == true)
{
    userId = JwtBearerUtil.GetUserIdFromPrincipal(User);
}
```

**Why `User.Identity?.IsAuthenticated` check is an anti-pattern**:
- Global `[Authorize]` filter is applied in `AppHost.cs` via `options.Filters.Add(new Microsoft.AspNetCore.Mvc.Authorization.AuthorizeFilter())`
- All controller actions are **already authenticated** by the framework
- Checking `IsAuthenticated` in action methods is redundant and adds unnecessary complexity
- If authentication fails, the request never reaches the controller action (returns 401)

**Workspace Access Control Pattern**:
Use `WorkspaceAccessHelper` (in `pecus.WebApi/Libs/`) for all workspace-related operations:

```csharp
// Controller setup
private readonly WorkspaceAccessHelper _accessHelper;

public MyController(WorkspaceAccessHelper accessHelper, ...)
{
    _accessHelper = accessHelper;
}

// ✅ CORRECT - In controller action
var userId = JwtBearerUtil.GetUserIdFromPrincipal(User);

// Check workspace access
var hasAccess = await _accessHelper.CanAccessWorkspaceAsync(userId, workspaceId);
if (!hasAccess)
{
    return TypedResults.NotFound(new ErrorResponse { Message = "ワークスペースが見つかりません。" });
}

// Proceed with operation...
```

**WorkspaceAccessHelper Methods**:
- `GetUserOrganizationIdAsync(int userId)`: Returns user's organization ID (null if not member)
- `CheckWorkspaceAccessAsync(int userId, int workspaceId)`: Returns (hasAccess, workspace) tuple
- `CanAccessWorkspaceAsync(int userId, int workspaceId)`: Returns bool only

**Security Principles**:
1. **Organization-based multi-tenancy**: Users can only access workspaces in their organization
2. **404 for unauthorized access**: Return 404 instead of 403 to hide resource existence
3. **Empty lists for GET operations**: Return empty lists instead of errors when no access
4. **Consistent error messages**: Use "ワークスペースが見つかりません。" for both missing and unauthorized workspaces

**When to use**:
- All workspace CRUD operations
- All workspace item operations (items, attachments, tags, pins)
- Any operation that involves a workspace ID parameter

**DI Registration**:
```csharp
// In pecus.WebApi/AppHost.cs
builder.Services.AddScoped<WorkspaceAccessHelper>();
```

### 4. Transaction Pattern for Multiple Table Operations (WebApi Layer)
**CRITICAL: Always use explicit transactions when modifying multiple tables** to ensure data consistency and atomicity.

**When to use transactions**:
- Creating/updating records across 2+ tables (e.g., Workspace + WorkspaceUser)
- Deleting parent records with child records (e.g., Organization + Users)
- Adding/removing many-to-many relationships (e.g., WorkspaceItem + Tags + WorkspaceItemTags)
- Any operation where partial success would leave data in an inconsistent state

**When code changes increase table operations**: If refactoring adds more table operations to an existing method, **you MUST wrap the entire method in a transaction**. Never assume existing code is safe without transactions.

**Transaction Pattern** (all DB operations must use this pattern):
```csharp
public async Task<TEntity> MethodAsync(...)
{
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
        // All database operations here
        _context.Entities.Add(entity1);
        await _context.SaveChangesAsync();

        _context.RelatedEntities.Add(entity2);
        await _context.SaveChangesAsync();

        // More operations...

        await transaction.CommitAsync();
        return result;
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;  // Re-throw to let exception filter handle it
    }
}
```

**Examples of methods requiring transactions**:
- `OrganizationService.CreateOrganizationAsync`: Creates Organization + User
- `WorkspaceService.CreateWorkspaceAsync`: Creates Workspace + WorkspaceUser
- `WorkspaceItemService.CreateWorkspaceItemAsync`: Creates WorkspaceItem + Tags + WorkspaceItemTags
- `WorkspaceItemService.SetTagsToItemAsync`: Deletes old + creates new WorkspaceItemTags
- `OrganizationService.DeleteOrganizationAsync`: Deletes Users + Organization

**Single-table operations**: Methods that modify only one table with one `SaveChangesAsync()` call don't need explicit transactions (EF Core handles atomicity automatically).

### 5. Hangfire Task Sharing Pattern
**Tasks must be in shared library** to be callable from WebApi and executable in BackFire:
```csharp
// pecus.Libs/Hangfire/Tasks/HangfireTasks.cs
public class HangfireTasks
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<HangfireTasks> _logger;

    // Constructor injection - dependencies resolved by DI
    public HangfireTasks(ApplicationDbContext context, ILogger<HangfireTasks> logger)
    {
        _context = context;
        _logger = logger;
    }

    public void TaskMethod(string param)
    {
        // Use injected dependencies
        _logger.LogInformation("Processing task with param: {Param}", param);
        // Database operations using _context
    }
}

// pecus.WebApi controller
public class MyController : ControllerBase
{
    private readonly IBackgroundJobClient _backgroundJobClient;

    public MyController(IBackgroundJobClient backgroundJobClient)
    {
        _backgroundJobClient = backgroundJobClient;
    }

    public IActionResult EnqueueTask()
    {
        _backgroundJobClient.Enqueue<HangfireTasks>(x => x.TaskMethod(localVariable));
        return Ok();
    }
}

// pecus.BackFire AppHost.cs - Must register task classes for DI resolution
builder.Services.AddScoped<HangfireTasks>();
// pecus.WebApi AppHost.cs - Must also register for client-side usage
builder.Services.AddScoped<HangfireTasks>();
```

**DI Integration Benefits**:
- **Automatic dependency resolution**: DbContext, ILogger, custom services automatically injected
- **Consistent service lifecycle**: Same DI scope and lifetime management as regular services
- **Configuration access**: `IConfiguration`, `IOptions<T>` available via constructor injection
- **Cross-cutting concerns**: Automatic transaction management, logging, error handling

**CRITICAL: Avoid Hangfire static methods** - Always use DI-injected services:
```csharp
// ✅ CORRECT - Use injected IBackgroundJobClient
public class MyController : ControllerBase
{
    private readonly IBackgroundJobClient _backgroundJobClient;

    public MyController(IBackgroundJobClient backgroundJobClient)
    {
        _backgroundJobClient = backgroundJobClient;
    }

    public IActionResult EnqueueJob()
    {
        _backgroundJobClient.Enqueue<HangfireTasks>(x => x.TaskMethod("param"));
        return Ok();
    }
}

// ❌ WRONG - Using static BackgroundJob class
BackgroundJob.Enqueue<HangfireTasks>(x => x.TaskMethod("param"));
```

**Loop Variable Capture**: Always copy to local variable before lambda:
```csharp
foreach (var item in items)
{
    var localItem = item;  // Local copy required for closure
    _backgroundJobClient.Enqueue<HangfireTasks>(x => x.ProcessItem(localItem));
}

// For loops also need local copies
for (int i = 0; i < items.Count; i++)
{
    var localItem = items[i];  // Local copy required
    _backgroundJobClient.Enqueue<HangfireTasks>(x => x.ProcessItem(localItem));
}
```

### 6. Environment-Aware Seeding
**DatabaseSeeder checks environment** via `IWebHostEnvironment.IsDevelopment()`:
- Production deploys: Only master data (Permissions, Roles, Genres)
- Development: Master data + mock data (sample Org, Users, Workspaces)
- Manual override: `/api/database/seed?isDevelopment=true` forces dev seed in production

### 7. Migration File Location
**EF Core migrations live in pecus.DbManager** (moved from pecus.WebApi):
```bash
cd pecus.DbManager
dotnet ef migrations add MigrationName
# Migration will auto-apply on next DbManager startup
```

All services can execute migrations because they reference pecus.Libs which contains the DbContext.

## Logging Architecture (Serilog)

### Unified Logging with Serilog
**All projects use Serilog** (migrated from NLog in WebApi):
- Configuration in `pecus.ServiceDefaults/Extensions.cs` via `AddSerilogLogging()`
- Console output: `[HH:mm:ss LEVEL] SourceContext: Message`
- File output: `logs/{ApplicationName}-YYYYMMDD.log` (daily rotation, 7-day retention)
- Enrichers: MachineName, EnvironmentName, ApplicationName

### Environment-Specific Log Levels
**Control EF Core SQL logging** in `appsettings.json` / `appsettings.Development.json`:
```json
// Production (appsettings.json) - Hide SQL
"Microsoft.EntityFrameworkCore.Database.Command": "Warning"

// Development (appsettings.Development.json) - Show SQL
"Microsoft.EntityFrameworkCore.Database.Command": "Information",
"Microsoft.EntityFrameworkCore.Query": "Debug"
```

### Structured Logging Pattern
```csharp
// ✅ CORRECT - Structured logging
_logger.LogInformation("User {UserId} logged in from {IpAddress}", userId, ipAddress);

// ❌ WRONG - String interpolation
_logger.LogInformation($"User {userId} logged in from {ipAddress}");
```

## Email System Architecture (MailKit + RazorLight)

### Mail Infrastructure (`pecus.Libs/Mail/`)
**Services**:
- `IEmailService` / `EmailService`: MailKit SMTP implementation
- `ITemplateService` / `RazorTemplateService`: Razor template rendering

**Models**:
- `EmailMessage`: To/Cc/Bcc, attachments, custom headers, priority
- `EmailAttachment`: File data with MIME type
- `EmailSettings`: SMTP config, from address, template path

**Templates** (`pecus.Libs/Mail/Templates/`):
- `*.html.cshtml`: HTML email templates
- `*.text.cshtml`: Plain text fallback templates
- `Models/`: Template model classes (e.g., `WelcomeEmailModel`)

### Email Service Registration
```csharp
// In WebApi/BackFire AppHost.cs
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("Email"));
builder.Services.AddScoped<ITemplateService, RazorTemplateService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<EmailTasks>();
```

### Email Configuration (`appsettings.json`)
```json
{
  "Email": {
    "SmtpHost": "smtp.example.com",
    "SmtpPort": 587,
    "UseSsl": true,
    "Username": "",
    "Password": "",
    "FromEmail": "noreply@example.com",
    "FromName": "Pecus Application",
    "TemplateRootPath": "Mail/Templates"
  }
}
```

**Development**: Use MailHog (`localhost:1025`) or Papercut-SMTP for local testing without real email sending.

## Development Workflow

### Build Verification
**CRITICAL: Always verify build after code changes**:
```bash
# Build entire solution to catch errors early
dotnet build e:\git\pecus-aspire\pecus.sln

# Check for warnings - treat warnings as potential issues
# Review all compiler errors and warnings before proceeding
```

**When to verify**:
- After modifying shared code in `pecus.Libs` (impacts all services)
- After entity model changes (check Services, Controllers, Response DTOs)
- After removing properties/methods (search all usages first)
- After adding new dependencies or NuGet packages
- Before creating database migrations
- Before committing code changes

**Common scenarios requiring extra verification**:
- Removing entity properties → Check Services, Controllers, Response/Request DTOs
- Changing method signatures in shared services → Check all calling code
- Modifying DbContext → Check all repository/service code
- Adding/removing navigation properties → Check Include() statements

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
cd pecus.DbManager
dotnet ef migrations add MigrationName
# Migration will auto-apply on next DbManager startup
```

### Creating Email Templates
1. **Create template files** in `pecus.Libs/Mail/Templates/`:
   - `templatename.html.cshtml` (HTML version)
   - `templatename.text.cshtml` (text fallback)
2. **Create model class** in `pecus.Libs/Mail/Templates/Models/`:
   ```csharp
   public class TemplateNameModel
   {
       public string PropertyName { get; set; }
   }
   ```
3. **Use `@model` directive** in templates:
   ```cshtml
   @model Pecus.Libs.Mail.Templates.Models.TemplateNameModel
   <p>Hello @Model.PropertyName</p>
   ```
4. **Enqueue email job** from controller/service

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
1. **Add method to appropriate task class** in pecus.Libs/Hangfire/Tasks/
   - General tasks → `HangfireTasks.cs`
   - Email tasks → `EmailTasks.cs`
2. **Ensure DI registration** in both `pecus.WebApi/AppHost.cs` and `pecus.BackFire/AppHost.cs`
3. **Build solution** (ensures BackFire sees new task)
4. **Enqueue from WebApi**: `_backgroundJobClient.Enqueue<EmailTasks>(x => x.SendTemplatedEmailAsync(...))`
5. **No additional changes needed in BackFire** (auto-discovers via DI)

### Sending Emails via Hangfire
```csharp
// In controller with DI-injected IBackgroundJobClient
public class EmailController : ControllerBase
{
    private readonly IBackgroundJobClient _backgroundJobClient;

    public EmailController(IBackgroundJobClient backgroundJobClient)
    {
        _backgroundJobClient = backgroundJobClient;
    }

    public IActionResult SendWelcomeEmail()
    {
        // Simple templated email
        _backgroundJobClient.Enqueue<EmailTasks>(x =>
            x.SendTemplatedEmailAsync(
                "user@example.com",
                "Welcome!",
                "welcome",
                new WelcomeEmailModel {
                    UserName = "John",
                    Email = "user@example.com",
                    OrganizationName = "Acme Corp",
                    LoginUrl = "https://app.example.com"
                }
            )
        );
        return Ok();
    }

    public IActionResult SendMonthlyReport()
    {
        // Bulk email with attachments
        var message = new EmailMessage {
            To = new List<string> { "user1@example.com", "user2@example.com" },
            Subject = "Monthly Report",
            Attachments = new List<EmailAttachment> {
                new EmailAttachment("report.pdf", pdfBytes, "application/pdf")
            }
        };
        _backgroundJobClient.Enqueue<EmailTasks>(x =>
            x.SendCustomTemplatedEmailAsync(message, "monthly-report", reportModel)
        );
        return Ok();
    }
}
```

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

## Service Layer Best Practices

### Code Size and Responsibility Distribution
**Service classes exceeding 1000 lines should be reviewed for responsibility distribution**:

**When to refactor**:
- Service file exceeds 1000 lines of code
- Service handles multiple unrelated concerns (e.g., CRUD + attachments + tags + PINs)
- Methods can be grouped by clear responsibility boundaries

**How to refactor**:
1. **Identify responsibility groups**: Analyze methods and group by domain concern
2. **Create specialized services**: Extract groups into dedicated service classes
   - Example: `WorkspaceItemService` (630 lines) → split into:
     - `WorkspaceItemService` (core CRUD, ~200 lines)
     - `WorkspaceItemAttachmentService` (attachment management, ~180 lines)
     - `WorkspaceItemPinService` (PIN management, ~150 lines)
     - `WorkspaceItemTagService` (tag management, ~100 lines)
3. **Update DI registration**: Register new services in `AppHost.cs` in dependency order
4. **Update controllers**: Inject specialized services alongside main service
5. **Verify build**: Run `dotnet build` to ensure no breaking changes

**Benefits**:
- Improved maintainability and testability
- Clearer separation of concerns
- Easier to navigate and understand codebase
- Reduced merge conflicts in team development

**Example**:
```csharp
// Before: Bloated service
public class WorkspaceItemService  // 630 lines
{
    // CRUD methods
    // Attachment methods
    // PIN methods
    // Tag methods
}

// After: Distributed responsibilities
public class WorkspaceItemService  // ~200 lines - Core CRUD only
public class WorkspaceItemAttachmentService  // ~180 lines
public class WorkspaceItemPinService  // ~150 lines
public class WorkspaceItemTagService  // ~100 lines
```

## Anti-Patterns to Avoid
- ❌ Direct service-to-service project references (use pecus.Libs for sharing)
- ❌ Connection strings in service projects (use Aspire resource names: `"pecusdb"`, `"redis"`)
- ❌ Hangfire tasks in controller files (must be in pecus.Libs for BackFire to execute)
- ❌ Hangfire tasks without DI registration (must register in both WebApi and BackFire AppHost.cs)
- ❌ Using Hangfire static methods like `BackgroundJob.Enqueue()` (use DI-injected `IBackgroundJobClient`)
- ❌ Lambda closures over loop variables without local copy (Hangfire serialization fails)
- ❌ Manual `Database.Migrate()` in WebApi (use pecus.DbManager for migrations)
- ❌ Hard-coded service URLs (Aspire handles service discovery)
- ❌ Seed data in migration files (use DatabaseSeeder for idempotent seeding)
- ❌ Skipping build verification after code changes (always run `dotnet build` to catch errors early)
- ❌ Multiple table operations without explicit transactions (always wrap in `BeginTransactionAsync()`)
- ❌ Adding table operations to existing methods without adding transaction wrapper (refactoring may introduce data inconsistency risks)
- ❌ Service classes exceeding 1000 lines without responsibility distribution review
- ❌ Checking `User.Identity?.IsAuthenticated` in controller actions (global `[Authorize]` filter already ensures authentication)
- ❌ Workspace operations without `WorkspaceAccessHelper` access checks (allows cross-organization data access)
- ❌ Placing controllers in wrong directory (use Controllers/ for logged-in users, Admin/ for admins, Backend/ for internal services, Entrance/ for public endpoints)

## Key Files Reference
- **pecus.AppHost/AppHost.cs**: Service topology, infrastructure resources, startup order
- **pecus.Libs/DB/ApplicationDbContext.cs**: Shared DbContext for all services
- **pecus.Libs/DB/Seed/DatabaseSeeder.cs**: Environment-aware seed data management
- **pecus.Libs/Hangfire/Tasks/HangfireTasks.cs**: Background job implementations
- **pecus.Libs/Hangfire/Tasks/EmailTasks.cs**: Email-specific background jobs
- **pecus.Libs/Mail/Services/EmailService.cs**: MailKit email sending implementation
- **pecus.Libs/Mail/Services/RazorTemplateService.cs**: Razor template rendering
- **pecus.ServiceDefaults/Extensions.cs**: Serilog configuration, service defaults
- **pecus.WebApi/AppHost.cs**: WebApi service configuration (JWT, Hangfire client, Swagger)
- **pecus.WebApi/Libs/WorkspaceAccessHelper.cs**: Workspace access control helper for organization-based multi-tenancy
- **pecus.BackFire/AppHost.cs**: Hangfire server configuration
- **pecus.DbManager/AppHost.cs**: Auto-migration on startup + manual endpoints
- **pecus.DbManager/DbInitializer.cs**: IHostedService for database initialization
- **pecus.WebApi/.github/copilot-instructions.md**: Detailed WebApi patterns (request DTOs, auth, exceptions)

## Project-Specific Conventions
1. **Service entry points named `AppHost.cs`** (not `Program.cs`) for consistency
2. **Aspire resource names lowercase**: `"pecusdb"`, `"redis"`, `"pecusapi"`, etc.
3. **All services reference pecus.Libs**, never each other
4. **JWT auth in WebApi only** (BackFire/DbManager are internal services)
5. **Seed data environment-aware**: Master data always, mock data only in dev
6. **Migrations in pecus.DbManager**, executed by DbInitializer on startup
7. **Logging with Serilog**: Structured logging, environment-specific EF Core SQL output
8. **Email templates in pecus.Libs/Mail/Templates**: HTML + Text versions with Razor syntax
9. **Controller directory structure** (WebApi): `Controllers/` for authenticated users, `Controllers/Admin/` for admins, `Controllers/Backend/` for internal services, `Controllers/Entrance/` for public endpoints

## Questions to Clarify
When implementing features across services:
- Which service owns this functionality? (API in WebApi, background processing in BackFire, DB setup in DbManager)
- Does this require shared code? (Add to pecus.Libs)
- Should this be a background job? (Add task to HangfireTasks.cs)
- Is this environment-specific? (Check `IsDevelopment()`)
- What are the Aspire dependencies? (Database? Redis? Other services?)
