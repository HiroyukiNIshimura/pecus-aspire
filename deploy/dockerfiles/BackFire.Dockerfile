# ============================================
# pecus.BackFire Dockerfile (Hangfire)
# ============================================

FROM mcr.microsoft.com/dotnet/aspnet:10.0-preview AS base
WORKDIR /app
EXPOSE 8080

# ============================================
# Build stage
# ============================================
FROM mcr.microsoft.com/dotnet/sdk:10.0-preview AS build
WORKDIR /src

# Copy project files
COPY ["pecus.BackFire/pecus.BackFire.csproj", "pecus.BackFire/"]
COPY ["pecus.Libs/pecus.Libs.csproj", "pecus.Libs/"]
COPY ["pecus.ServiceDefaults/pecus.ServiceDefaults.csproj", "pecus.ServiceDefaults/"]
COPY ["pecus.DbManager/pecus.DbManager.csproj", "pecus.DbManager/"]

# Restore dependencies
RUN dotnet restore "pecus.BackFire/pecus.BackFire.csproj"

# Copy source code
COPY pecus.BackFire/ pecus.BackFire/
COPY pecus.Libs/ pecus.Libs/
COPY pecus.ServiceDefaults/ pecus.ServiceDefaults/
COPY pecus.DbManager/ pecus.DbManager/

WORKDIR /src/pecus.BackFire
RUN dotnet build "pecus.BackFire.csproj" -c Release -o /app/build

# ============================================
# Publish stage
# ============================================
FROM build AS publish
RUN dotnet publish "pecus.BackFire.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ============================================
# Final stage
# ============================================
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create directories for data and logs
RUN mkdir -p /app/data/uploads /app/data/notifications /app/logs

ENTRYPOINT ["dotnet", "pecus.BackFire.dll"]
