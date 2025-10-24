# Pecus API - AI Agent Instructions

## Project Philosophy
**Conversation-Driven Development**: Built entirely through Copilot conversations without manual coding. Solve problems through iteration, not speculation.

## Architecture Overview

### Multi-Tenant SaaS Structure
```
Organization (組織) 1:N
├── Users (ユーザー)
└── Workspaces (ワークスペース) 1:N WorkspaceUser M:N User

User M:N Role M:N Permission
```

**Key Entities**:
- **User**: LoginId (auto-generated 16-char hash), Username, Email. Belongs to Organization.
- **Organization**: Multi-tenant root. Has Code (unique), Phone (required), Email (optional).
- **Workspace**: Belongs to Organization. Code auto-generated (8-char alphanumeric, org-unique, immutable).
- **WorkspaceUser**: Junction table with metadata (WorkspaceRole: Owner/Member/Guest, JoinedAt, InvitedByUserId).
- **Role/Permission**: RBAC system with many-to-many relationships.
- **Genre**: Master data for workspace types with icon support.

### Layer Architecture
**Controller → Service → DbContext → SQL Server**

- **Controllers** (`Controllers/*.cs`): Thin layer using TypedResults. No business logic. Import `Pecus.Models.Requests` namespace.
- **Services** (`Services/*.cs`): All business logic, validation, EF Core queries. Methods accept **request DTOs** (not individual parameters).
- **Request DTOs** (`Models/Requests/*.cs`): Centralized validation with DataAnnotations. Each entity has separate file (e.g., `UserRequests.cs`).
- **Response DTOs** (`Models/Responses/{Entity}/*.cs`): Separate response models per endpoint type.
- **Entities** (`DB/Models/*.cs`): EF Core entities with navigation properties.

## Critical Patterns

### 1. Request DTO Pattern (Recently Refactored)
**All service methods accept request objects, NOT individual parameters:**

```csharp
// ✅ CORRECT: Service accepts request DTO
public async Task<User> CreateUserAsync(CreateUserRequest request, int? createdByUserId = null)

// ❌ WRONG: Don't pass individual parameters
public async Task<User> CreateUserAsync(string username, string email, string password, ...)
```

**Request DTOs centralized in `Models/Requests/`:**
- `UserRequests.cs`: CreateUserRequest, UpdateUserRequest, LoginRequest
- `OrganizationRequests.cs`: CreateOrganizationRequest (includes admin user fields), UpdateOrganizationRequest
- `WorkspaceRequests.cs`: CreateWorkspaceRequest, UpdateWorkspaceRequest
- `RoleRequests.cs`, `PermissionRequests.cs`, `GenreRequests.cs`: Create-only requests

**Controllers must:**
1. Import `using Pecus.Models.Requests;`
2. Accept request DTO in endpoint method
3. Pass entire DTO to service method (not individual properties)

### 2. Global Authentication with Selective Anonymous Access
**CRITICAL**: Uses global authentication policy with explicit exceptions:

```csharp
// Program.cs: Global auth policy
builder.Services.AddControllers(options =>
{
    options.Filters.Add<ValidationFilter>();
    options.Filters.Add(new Microsoft.AspNetCore.Mvc.Authorization.AuthorizeFilter());  // Global auth
});

// Controllers: Mark specific endpoints as anonymous
[AllowAnonymous]  // Only for: organization registration, user login
[HttpPost]
```

**Authentication Flow**:
1. **Organization Registration**: `POST /api/organizations` (anonymous) creates org + admin user
2. **Login**: `POST /api/users/login` (anonymous) returns JWT
3. **All Other Operations**: Require authentication (no individual `[Authorize]` needed)

### 3. Transactional Organization+User Creation
**Organization registration creates admin user atomically:**

```csharp
// OrganizationService.CreateOrganizationAsync returns tuple
public async Task<(Organization organization, User adminUser)> CreateOrganizationAsync(...)
{
    using var transaction = await _context.Database.BeginTransactionAsync();
    // ... create organization, then admin user
    return (organization, adminUser);
}
```

**Request includes admin user fields:**
```csharp
public class CreateOrganizationRequest
{
    public required string Name { get; set; }
    // ... org fields
    public required string AdminUsername { get; set; }  // NEW
    public required string AdminEmail { get; set; }     // NEW
    public required string AdminPassword { get; set; }  // NEW
}
```

### 4. RESTful Endpoint Design
**Routes**: Explicit lowercase plurals: `api/users`, `api/organizations`, `api/workspaces`, `api/roles`, `api/permissions`, `api/genres`
- **Never** use `[controller]` placeholder
- **List**: `GET /api/{resource}?page=1&activeOnly=true`
- **State**: `PATCH /api/{resource}/{id}/activate` or `/deactivate`
- **Relations**: `PUT /api/users/{id}/roles/{roleId}` (add), `DELETE` (remove)
- **File Upload**: `POST /api/uploads/{fileType}/{resourceId}` with multipart/form-data

### 5. Exception Handling (Type-Based)
**CRITICAL**: Never check exception messages to determine HTTP status codes. Use typed exceptions:

```csharp
// ✅ CORRECT: Service throws typed exceptions
throw new NotFoundException("ユーザーが見つかりません。");
throw new DuplicateException("メールアドレスは既に使用されています。");

// ✅ CORRECT: Controller catches by type
catch (NotFoundException ex)
{
    return TypedResults.NotFound(new ErrorResponse { StatusCode = 404, Message = ex.Message });
}
catch (DuplicateException ex)
{
    return TypedResults.BadRequest(new ErrorResponse { StatusCode = 400, Message = ex.Message });
}
```

**Custom Exceptions** (`Exceptions/*.cs`):
- `NotFoundException`: 404 - Resource not found
- `DuplicateException`: 400 - Unique constraint violation
- `InvalidOperationException`: 400 - Business rule violation

### 6. Code Generation and File Handling
**Use `Libs/CodeGenerator.cs` static methods:**
- `CodeGenerator.GenerateLoginId()`: 16-char URL-safe hash for User.LoginId
- `CodeGenerator.GenerateWorkspaceCode()`: 8-char alphanumeric for Workspace.Code

**Use `Libs/FileUploadHelper.cs` for files:**
- `FileUploadHelper.GenerateUniqueFileHash()`: 32-char hash for file names
- Supports avatar, genre, workspace, organization file types
- Custom validation via `AvatarTypeAttribute` in `Models/Validation/`

### 7. JWT Authentication and Audit Tracking
- **Config**: `appsettings.json` → `Pecus:Jwt` section
- **Initialization**: `JwtBearerUtil.Initialize(pecusConfig)` in `Program.cs`
- **User ID Extraction**: `JwtBearerUtil.GetUserIdFromPrincipal(User)` in controllers
- **Audit Tracking**: Pass `userId` to service methods for `CreatedByUserId`/`UpdatedByUserId`

## Development Workflow

### Running the App
```bash
dotnet watch --launch-profile https
```
Opens Swagger UI at root (`/`) via `options.RoutePrefix = string.Empty` in `Program.cs`

### Database Migrations
```bash
dotnet ef migrations add MigrationName
dotnet ef database update
```
**Connection**: LocalDB at `(localdb)\mssqllocaldb`, database `Pecus`

### Service Registration Order
**CRITICAL**: Register services in dependency order in `Program.cs`:
```csharp
builder.Services.AddScoped<UserService>();          // Base service
builder.Services.AddScoped<RoleService>();
builder.Services.AddScoped<PermissionService>();
builder.Services.AddScoped<OrganizationService>();  // Depends on UserService
builder.Services.AddScoped<WorkspaceService>();
builder.Services.AddScoped<GenreService>();
builder.Services.AddScoped<FileUploadService>();
```

## Common Tasks

### Adding a New Entity
1. **Entity**: Create in `DB/Models/` with audit fields (CreatedByUserId, UpdatedByUserId, IsActive, timestamps)
2. **DbContext**: Add `DbSet<T>` to `ApplicationDbContext.cs`, configure in `OnModelCreating`
3. **Request DTOs**: Create `Models/Requests/{Entity}Requests.cs` with Create/Update classes
4. **Response DTOs**: Create `Models/Responses/{Entity}/` directory with response models
5. **Service**: Create `Services/{Entity}Service.cs` with methods accepting request DTOs
6. **Controller**: Create `Controllers/{Entity}Controller.cs` with explicit `[Route("api/{plural}")]`
7. **Register**: Add `builder.Services.AddScoped<{Entity}Service>()` in `Program.cs`

### Adding Atomic Multi-Entity Operations
**Pattern for operations creating multiple entities:**
```csharp
public async Task<(EntityA entityA, EntityB entityB)> CreateBothAsync(...)
{
    using var transaction = await _context.Database.BeginTransactionAsync();
    try
    {
        // Create entities in order
        await transaction.CommitAsync();
        return (entityA, entityB);
    }
    catch
    {
        await transaction.RollbackAsync();
        throw;
    }
}
```

### Custom Validation Attributes
**Create in `Models/Validation/` for domain-specific validation:**
```csharp
public class CustomAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        // Use helper classes from Libs/ for validation logic
    }
}
```

## Anti-Patterns to Avoid
- ❌ Individual `[Authorize]` attributes (use global auth + `[AllowAnonymous]` exceptions)
- ❌ Inline request classes in controllers (use `Models/Requests/*.cs`)
- ❌ Passing individual parameters to service methods (use request DTOs)
- ❌ Business logic in controllers
- ❌ **Message-based exception handling** (check `ex.Message.Contains()` - use typed exceptions instead)
- ❌ Non-transactional multi-entity operations
- ❌ Manual file name generation (use `FileUploadHelper`)

## Key Files Reference
- **Program.cs**: DI registration, middleware pipeline, global auth policy, JWT initialization
- **ApplicationDbContext.cs**: All entity configurations, relationship mappings via `OnModelCreating`
- **Filters/ValidationFilter.cs**: Global request validation returning `ErrorResponse` with field details
- **Libs/CodeGenerator.cs**: LoginId and WorkspaceCode generation
- **Libs/FileUploadHelper.cs**: File hash generation and upload utilities
- **Libs/JwtBearerUtil.cs**: Token generation and user ID extraction from JWT claims
- **Models/Config/PecusConfig.cs**: Strongly-typed config bound from `appsettings.json`

```csharp
// ✅ CORRECT: Service throws typed exceptions
throw new NotFoundException("ユーザーが見つかりません。");
throw new DuplicateException("メールアドレスは既に使用されています。");

// ✅ CORRECT: Controller catches by type
catch (NotFoundException ex)
{
    return TypedResults.NotFound(new ErrorResponse { StatusCode = 404, Message = ex.Message });
}
catch (DuplicateException ex)
{
    return TypedResults.BadRequest(new ErrorResponse { StatusCode = 400, Message = ex.Message });
}

// ❌ WRONG: Never use message inspection
catch (InvalidOperationException ex)
{
    if (ex.Message.Contains("見つかりません")) // FORBIDDEN
        return TypedResults.NotFound(...);
}
```

**Custom Exceptions** (`Exceptions/*.cs`):
- `NotFoundException`: 404 - Resource not found
- `DuplicateException`: 400 - Unique constraint violation
- `InvalidOperationException`: 400 - Business rule violation

**Controller Exception Pattern**:
```csharp
[HttpPost]
public async Task<Results<Ok<T>, BadRequest<ErrorResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>> Method(...)
{
    try { /* ... */ }
    catch (NotFoundException ex) { return TypedResults.NotFound(...); }
    catch (DuplicateException ex) { return TypedResults.BadRequest(...); }
    catch (InvalidOperationException ex) { return TypedResults.BadRequest(...); }
    catch (Exception ex) { _logger.LogError(ex, ...); return TypedResults.StatusCode(500); }
}
```

### 6. Code Generation
**Use `Libs/CodeGenerator.cs` static methods:**
- `CodeGenerator.GenerateLoginId()`: 16-char URL-safe hash for User.LoginId
- `CodeGenerator.GenerateWorkspaceCode()`: 8-char alphanumeric for Workspace.Code

**Services call generator + uniqueness check:**
```csharp
string loginId;
do
{
    loginId = CodeGenerator.GenerateLoginId();
} while (await _context.Users.AnyAsync(u => u.LoginId == loginId));
```

### 7. JWT Authentication
- **Config**: `appsettings.json` → `Pecus:Jwt` section
- **Initialization**: `JwtBearerUtil.Initialize(pecusConfig)` in `Program.cs`
- **User ID Extraction**: `JwtBearerUtil.GetUserIdFromPrincipal(User)` in controllers
- **Audit Tracking**: Pass `userId` to service methods for `CreatedByUserId`/`UpdatedByUserId`

### 8. Many-to-Many Relationships
**Junction Tables with Metadata**: When M:N needs additional fields, create explicit entity (e.g., `WorkspaceUser`):

```csharp
// ✅ CORRECT: Explicit junction entity with metadata
public class WorkspaceUser
{
    public int WorkspaceId { get; set; }
    public int UserId { get; set; }
    public string? WorkspaceRole { get; set; }  // Additional metadata
    public DateTime JoinedAt { get; set; }
    // ... navigation properties
}

// DbContext configuration with composite key
modelBuilder.Entity<WorkspaceUser>(entity =>
{
    entity.HasKey(wu => new { wu.WorkspaceId, wu.UserId });
    entity.HasOne(wu => wu.Workspace).WithMany(w => w.WorkspaceUsers)...
    entity.HasOne(wu => wu.User).WithMany(u => u.WorkspaceUsers)...
});
```

**Business Rules in Junction**: Enforce constraints in service layer (e.g., users can only join workspaces in their organization).

## Development Workflow

### Running the App
```bash
dotnet watch --launch-profile https
```
Opens Swagger UI at root (`/`) via `options.RoutePrefix = string.Empty` in `Program.cs`

### Database Migrations
```bash
dotnet ef migrations add MigrationName
dotnet ef database update
```
**Connection**: LocalDB at `(localdb)\mssqllocaldb`, database `Pecus`

### Configuration
- **appsettings.json**: `Pecus:Jwt`, `Pecus:Pagination.DefaultPageSize` (20), `Pecus:Application.Name/Version`
- **nlog.config**: File logging to `log/` directory
- **Pecus.csproj**: .NET 9.0, XML docs enabled for Swagger

## Common Tasks

### Adding a New Entity
1. **Entity**: Create in `DB/Models/` with audit fields (CreatedByUserId, UpdatedByUserId, IsActive, timestamps)
2. **DbContext**: Add `DbSet<T>` to `ApplicationDbContext.cs`, configure in `OnModelCreating`
3. **Request DTOs**: Create `Models/Requests/{Entity}Requests.cs` with Create/Update classes
4. **Response DTOs**: Create `Models/Responses/{Entity}/` directory with response models
5. **Service**: Create `Services/{Entity}Service.cs` with methods accepting request DTOs
6. **Controller**: Create `Controllers/{Entity}Controller.cs` with explicit `[Route("api/{plural}")]`
7. **Register**: Add `builder.Services.AddScoped<{Entity}Service>()` in `Program.cs`

### Adding a Controller Endpoint
- XML summary comments (visible in Swagger)
- Return `Results<Ok<T>, BadRequest<ErrorResponse>, NotFound<ErrorResponse>, StatusCodeHttpResult>`
- List endpoints: `HttpGet` without route, accept `page?` and `activeOnly?`
- Import `using Pecus.Models.Requests;` and `using Pecus.Exceptions;`
- **Always** include proper exception handling with typed exceptions

### Adding a Many-to-Many Relationship
1. **Create Junction Entity**: `DB/Models/{Entity1}{Entity2}.cs` with composite key + metadata fields
2. **Update Parent Entities**: Add `ICollection<JunctionEntity>` navigation properties
3. **Configure in DbContext**: Composite key, relationships, indexes in `OnModelCreating`
4. **Service Methods**: Add/Remove methods with business rule validation
5. **Controller Endpoints**: `POST /{entity1}/{id}/{entity2}` (add), `DELETE /{entity1}/{id}/{entity2}/{id2}` (remove)

## Anti-Patterns to Avoid
- ❌ Inline request classes in controllers (use `Models/Requests/*.cs`)
- ❌ Passing individual parameters to service methods (use request DTOs)
- ❌ Business logic in controllers
- ❌ `[HttpPost]` for state changes (use `PATCH` for activate/deactivate)
- ❌ Client-controlled page sizes (server dictates via `DefaultPageSize`)
- ❌ **Message-based exception handling** (check `ex.Message.Contains()` - use typed exceptions instead)
- ❌ Simple dictionary-based M:N tables when metadata needed (create explicit junction entity)

## Key Files Reference
- **Program.cs**: DI registration, middleware pipeline, NLog setup, JWT initialization
- **ApplicationDbContext.cs**: All entity configurations, relationship mappings via `OnModelCreating`
- **Filters/ValidationFilter.cs**: Global request validation returning `ErrorResponse` with field details
- **Exceptions/NotFoundException.cs**: 404 errors for missing resources
- **Exceptions/DuplicateException.cs**: 400 errors for unique constraint violations
- **Libs/CodeGenerator.cs**: Static methods for LoginId and WorkspaceCode generation
- **Libs/PaginationHelper.cs**: Standardized Skip/Take logic + `PagedResponse` creation
- **Libs/JwtBearerUtil.cs**: Token generation and user ID extraction from JWT claims
- **Models/Config/PecusConfig.cs**: Strongly-typed config bound from `appsettings.json`

## Questions to Clarify
When implementing features, ask:
- Multi-tenancy scope (organization-level vs system-wide uniqueness)?
- Audit requirements (track `UpdatedByUserId`)?
- Soft delete vs hard delete?
- Pagination for related entities (e.g., `GET /organizations/{id}/users`)?
