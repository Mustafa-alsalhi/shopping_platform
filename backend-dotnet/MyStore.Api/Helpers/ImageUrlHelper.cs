using Microsoft.AspNetCore.Http;

namespace MyStore.Api.Helpers;

public static class ImageUrlHelper
{
    private static readonly string WorkspaceRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".."));

    private static IEnumerable<string> GetSearchRoots(IWebHostEnvironment env)
    {
        var apiWwwRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
        yield return apiWwwRoot;

        var backendPublic = Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", "..", "backend", "public"));
        if (Directory.Exists(backendPublic)) yield return backendPublic;

        var backendStorage = Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", "..", "backend", "storage", "app", "public"));
        if (Directory.Exists(backendStorage)) yield return backendStorage;

        var rootPublic = Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", "..", "public"));
        if (Directory.Exists(rootPublic)) yield return rootPublic;

        var frontendPublic = Path.GetFullPath(Path.Combine(env.ContentRootPath, "..", "..", "frontend", "public"));
        if (Directory.Exists(frontendPublic)) yield return frontendPublic;
    }

    public static string? Resolve(HttpRequest request, IWebHostEnvironment env, string? rawPath, string defaultSubFolder = "images/products", string? fallback = null)
    {
        if (string.IsNullOrWhiteSpace(rawPath))
            return fallback;

        var clean = rawPath.Trim().Replace("\\", "/");
        if (clean.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
            clean.StartsWith("https://", StringComparison.OrdinalIgnoreCase) ||
            clean.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            return clean;
        }

        if (clean.Contains("default-product", StringComparison.OrdinalIgnoreCase) ||
            clean.Contains("placeholder", StringComparison.OrdinalIgnoreCase))
        {
            return fallback ?? "https://placehold.co/400x400/fef3c7/b45309?text=Asalah";
        }

        var trimmed = clean.TrimStart('/');
        var baseUrl = $"{request.Scheme}://{request.Host}";

        // Candidate relative URLs to check on disk
        var candidates = new List<string>();

        if (trimmed.StartsWith("storage/", StringComparison.OrdinalIgnoreCase))
        {
            var withoutStorage = trimmed.Substring("storage/".Length);
            candidates.Add(trimmed);
            candidates.Add(withoutStorage);
        }
        else if (trimmed.StartsWith("images/", StringComparison.OrdinalIgnoreCase) ||
                 trimmed.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase) ||
                 trimmed.StartsWith("banners/", StringComparison.OrdinalIgnoreCase) ||
                 trimmed.StartsWith("offers/", StringComparison.OrdinalIgnoreCase) ||
                 trimmed.StartsWith("payment_images/", StringComparison.OrdinalIgnoreCase) ||
                 trimmed.StartsWith("seller_avatars/", StringComparison.OrdinalIgnoreCase))
        {
            candidates.Add(trimmed);
            candidates.Add($"storage/{trimmed}");
        }
        else
        {
            // Filename only or custom subfolder
            var folder = defaultSubFolder.Trim('/');
            candidates.Add($"{folder}/{trimmed}");
            candidates.Add($"storage/{folder}/{trimmed}");
            if (!folder.StartsWith("images/", StringComparison.OrdinalIgnoreCase))
            {
                candidates.Add($"images/{folder}/{trimmed}");
                candidates.Add($"storage/images/{folder}/{trimmed}");
            }
            candidates.Add($"storage/{trimmed}");
            candidates.Add(trimmed);
        }

        var roots = GetSearchRoots(env).ToList();
        foreach (var candidate in candidates.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var relDisk = candidate.Replace('/', Path.DirectorySeparatorChar);
            foreach (var root in roots)
            {
                var full = Path.Combine(root, relDisk);
                if (File.Exists(full))
                {
                    // If found in backend/storage/app/public directly (without "storage/" prefix), serve via /storage/...
                    if (root.EndsWith(Path.Combine("storage", "app", "public"), StringComparison.OrdinalIgnoreCase) &&
                        !candidate.StartsWith("storage/", StringComparison.OrdinalIgnoreCase))
                    {
                        return $"{baseUrl}/storage/{candidate}";
                    }
                    return $"{baseUrl}/{candidate}";
                }
            }
        }

        // If file not found on disk, return fallback if provided, otherwise best-guess URL
        if (!string.IsNullOrEmpty(fallback))
            return fallback;

        if (trimmed.StartsWith("images/", StringComparison.OrdinalIgnoreCase) ||
            trimmed.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase) ||
            trimmed.StartsWith("storage/", StringComparison.OrdinalIgnoreCase))
        {
            return $"{baseUrl}/{trimmed}";
        }

        return $"{baseUrl}/{defaultSubFolder.Trim('/')}/{trimmed}";
    }
}

