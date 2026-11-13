using System.Net;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;

namespace MyStore.Api.Middleware;

public class MaintenanceMiddleware
{
    private readonly RequestDelegate _next;

    public MaintenanceMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IAppDbContext dbContext)
    {
        var path = context.Request.Path.Value?.ToLowerInvariant() ?? "";

        // Allow admin routes, auth login, and settings even during maintenance
        if (path.StartsWith("/api/admin") || path.StartsWith("/api/login") || path.StartsWith("/api/settings") || path.StartsWith("/swagger"))
        {
            await _next(context);
            return;
        }

        try
        {
            var setting = await dbContext.Settings.AsNoTracking().OrderBy(s => s.Id).FirstOrDefaultAsync();
            if (setting != null && setting.MaintenanceMode)
            {
                var isAdmin = context.User.Identity?.IsAuthenticated == true && context.User.IsInRole("admin");
                if (!isAdmin)
                {
                    context.Response.StatusCode = StatusCodes.Status503ServiceUnavailable;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsync(JsonSerializer.Serialize(new
                    {
                        success = false,
                        maintenance_mode = true,
                        message = setting.MaintenanceMessage ?? "الموقع تحت الصيانة حالياً، يرجى المحاولة لاحقاً."
                    }));
                    return;
                }
            }
        }
        catch
        {
            // Ignore DB errors in maintenance check if DB isn't migrated yet
        }

        await _next(context);
    }
}
