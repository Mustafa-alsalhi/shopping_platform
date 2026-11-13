using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Infrastructure.Services;

public class FileStorageService : IFileStorageService
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".pdf"
    };

    private readonly string _webRootPath;

    public FileStorageService(string webRootPath)
    {
        _webRootPath = webRootPath;
    }

    public async Task<string> SaveFileAsync(Stream fileStream, string originalFileName, string subFolder, string baseUrl = "")
    {
        var ext = Path.GetExtension(originalFileName);
        if (string.IsNullOrEmpty(ext) || !AllowedExtensions.Contains(ext))
        {
            ext = ".png";
        }

        var safeFileName = $"{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}_{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
        var relativeFolder = Path.Combine("storage", "images", subFolder.Trim('/', '\\'));
        var targetDirectory = Path.Combine(_webRootPath, relativeFolder);

        Directory.CreateDirectory(targetDirectory);

        var fullPath = Path.Combine(targetDirectory, safeFileName);
        await using var output = new FileStream(fullPath, FileMode.Create);
        await fileStream.CopyToAsync(output);

        var urlPath = $"images/{subFolder.Trim('/', '\\').Replace('\\', '/')}/{safeFileName}";
        if (string.IsNullOrEmpty(baseUrl))
        {
            return urlPath;
        }
        return $"{baseUrl.TrimEnd('/')}/storage/{urlPath}";
    }
}
