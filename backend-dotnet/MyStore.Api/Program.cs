using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.Extensions.FileProviders;
using MyStore.Api.Data;
using MyStore.Api.Middleware;
using MyStore.Application.Interfaces;
using MyStore.Infrastructure.Persistence;
using MyStore.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. JSON Serialization (snake_case to match Laravel API & React/Angular models seamlessly)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower;
        options.JsonSerializerOptions.DictionaryKeyPolicy = JsonNamingPolicy.SnakeCaseLower;
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddMemoryCache();
builder.Services.AddHttpContextAccessor();

// 2. Database Configuration (Supports MySQL now + SQL Server later via DatabaseProvider setting)
var dbProvider = builder.Configuration["DatabaseProvider"] ?? "MySql";
var mySqlConn = builder.Configuration.GetConnectionString("DefaultConnection")
                ?? "Server=127.0.0.1;Port=3306;Database=ecommerce_store;User=root;Password=;";
var sqlServerConn = builder.Configuration.GetConnectionString("SqlServerConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (dbProvider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrEmpty(sqlServerConn))
    {
        options.UseSqlServer(sqlServerConn);
    }
    else
    {
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 30));
        options.UseMySql(mySqlConn, serverVersion);
    }
});

builder.Services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

// 3. Infrastructure Services
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();
builder.Services.AddHttpClient<ISmsService, QuickConnectSmsService>(client =>
{
    client.Timeout = TimeSpan.FromSeconds(20);
});
builder.Services.AddScoped<IDeliveryService, DeliveryService>();
builder.Services.AddSingleton<IFileStorageService>(sp =>
{
    var env = sp.GetRequiredService<IWebHostEnvironment>();
    var webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
    Directory.CreateDirectory(webRoot);
    return new FileStorageService(webRoot);
});

// 4. JWT Authentication & Role-Based Authorization Policies
var jwtKey = builder.Configuration["Jwt:Key"] ?? "MyStoreMultiVendorPlatformSecretKey_2026_SecureTokenKey!@#";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "MyStoreApi";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "MyStoreClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(5)
    };
});

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("admin"));
    options.AddPolicy("SellerOnly", policy => policy.RequireRole("seller", "admin"));
    options.AddPolicy("DriverOnly", policy => policy.RequireRole("driver", "admin"));
    options.AddPolicy("CustomerOrAny", policy => policy.RequireAuthenticatedUser());
});

// 5. CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://localhost:4200",
                "http://127.0.0.1:4200",
                "http://localhost:5173"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// 6. Swagger / OpenAPI with JWT Bearer Support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "منصة أصالة - Multi-Vendor E-Commerce & Delivery API",
        Version = "v1",
        Description = "ASP.NET Core Web API converted from Laravel with full RBAC (Admin, Seller, Driver, Customer), WhatsApp OTP, and Haversine Delivery."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "أدخل التوكن بصيغة: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

await DbSeeder.SeedAsync(app.Services);

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "MyStore API v1");
});

app.UseStaticFiles();

// Serve legacy Laravel public, storage, and frontend assets seamlessly
var apiWwwRoot = app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(apiWwwRoot);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(apiWwwRoot),
    RequestPath = "/storage"
});

var backendPublicDir = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "..", "backend", "public"));
if (Directory.Exists(backendPublicDir))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(backendPublicDir),
        RequestPath = ""
    });
}

var backendStoragePublicDir = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "..", "backend", "storage", "app", "public"));
if (Directory.Exists(backendStoragePublicDir))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(backendStoragePublicDir),
        RequestPath = "/storage"
    });
}

var rootPublicDir = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "..", "public"));
if (Directory.Exists(rootPublicDir))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(rootPublicDir),
        RequestPath = ""
    });
}

var frontendPublicDir = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "..", "frontend", "public"));
if (Directory.Exists(frontendPublicDir))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(frontendPublicDir),
        RequestPath = ""
    });
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.UseMiddleware<MaintenanceMiddleware>();
app.UseMiddleware<FormSnakeCaseMiddleware>();

app.MapControllers();

// Health & Test endpoints matching routes/api.php
app.MapGet("/api/test-order", () => Results.Ok(new
{
    message = "Order API is working! (ASP.NET Core 8)",
    database = "Connected",
    timestamp = DateTime.UtcNow
}));

app.Run();

