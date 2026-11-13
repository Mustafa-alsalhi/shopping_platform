using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;

namespace MyStore.Api.Middleware;

/// <summary>
/// Laravel/React/Angular clients send multipart form keys in snake_case (e.g. old_price).
/// ASP.NET Core form model binding matches C# property names, so this middleware adds a
/// PascalCase alias (OldPrice) for every snake_case key while keeping the original key,
/// letting both [FromForm] DTOs and snake_case action parameters bind correctly.
/// </summary>
public class FormSnakeCaseMiddleware
{
    private readonly RequestDelegate _next;

    public FormSnakeCaseMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.HasFormContentType)
        {
            var form = await context.Request.ReadFormAsync();
            var dict = new Dictionary<string, StringValues>(StringComparer.Ordinal);

            foreach (var kv in form)
            {
                dict[kv.Key] = kv.Value;
                if (kv.Key.Contains('_'))
                {
                    var pascal = string.Concat(kv.Key
                        .Split('_', StringSplitOptions.RemoveEmptyEntries)
                        .Select(p => char.ToUpperInvariant(p[0]) + p[1..]));
                    dict.TryAdd(pascal, kv.Value);
                }
            }

            context.Request.Form = new FormCollection(dict, form.Files);
        }

        await _next(context);
    }
}

