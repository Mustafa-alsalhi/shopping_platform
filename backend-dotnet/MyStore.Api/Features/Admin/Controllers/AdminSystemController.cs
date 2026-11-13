using System.IO.Compression;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;
using MyStore.Api.Features.Admin.Dtos;
using MyStore.Api.Features.Seller.Dtos;

namespace MyStore.Api.Features.Admin.Controllers;

public class AdminSystemController : AdminControllerBase
{
    public AdminSystemController(IAppDbContext db, IDeliveryService deliveryService, IFileStorageService fileStorage, IWebHostEnvironment env) : base(db, deliveryService, fileStorage, env) { }

    private ulong? GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return ulong.TryParse(claim, out var id) ? id : null;
        }

    [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            var settings = await _db.Settings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new Setting { CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
                _db.Settings.Add(settings);
                await _db.SaveChangesAsync();
            }
            return Ok(settings);
        }

    [HttpPost("settings")]
        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettings([FromForm] Setting form, IFormFile? store_logo, IFormFile? store_favicon)
        {
            var settings = await _db.Settings.FirstOrDefaultAsync();
            if (settings == null)
            {
                settings = new Setting { CreatedAt = DateTime.UtcNow };
                _db.Settings.Add(settings);
            }
    
            if (store_logo != null && store_logo.Length > 0)
            {
                using var s = store_logo.OpenReadStream();
                settings.StoreLogo = "/storage/" + await _fileStorage.SaveFileAsync(s, store_logo.FileName, "settings");
            }
    
            if (store_favicon != null && store_favicon.Length > 0)
            {
                using var s = store_favicon.OpenReadStream();
                settings.StoreFavicon = "/storage/" + await _fileStorage.SaveFileAsync(s, store_favicon.FileName, "settings");
            }
    
            settings.StoreName = form.StoreName ?? settings.StoreName;
            settings.StoreDescription = form.StoreDescription ?? settings.StoreDescription;
            settings.StoreEmail = form.StoreEmail ?? settings.StoreEmail;
            settings.StorePhone = form.StorePhone ?? settings.StorePhone;
            settings.StoreAddress = form.StoreAddress ?? settings.StoreAddress;
            settings.FacebookUrl = form.FacebookUrl ?? settings.FacebookUrl;
            settings.InstagramUrl = form.InstagramUrl ?? settings.InstagramUrl;
            settings.TwitterUrl = form.TwitterUrl ?? settings.TwitterUrl;
            settings.TiktokUrl = form.TiktokUrl ?? settings.TiktokUrl;
            settings.YoutubeUrl = form.YoutubeUrl ?? settings.YoutubeUrl;
            settings.TelegramUrl = form.TelegramUrl ?? settings.TelegramUrl;
            settings.WhatsappUrl = form.WhatsappUrl ?? settings.WhatsappUrl;
            settings.SiteName = form.SiteName ?? settings.SiteName;
            settings.SiteLanguage = form.SiteLanguage ?? settings.SiteLanguage;
            settings.Timezone = form.Timezone ?? settings.Timezone;
            settings.AllowRegistration = form.AllowRegistration;
            settings.AllowGuestCheckout = form.AllowGuestCheckout;
            settings.MaintenanceMode = form.MaintenanceMode;
            settings.MaintenanceMessage = form.MaintenanceMessage ?? settings.MaintenanceMessage;
            settings.MaintenanceAdminOnly = form.MaintenanceAdminOnly;
            settings.DeliveryZones = form.DeliveryZones ?? settings.DeliveryZones;
            settings.UpdatedAt = DateTime.UtcNow;
    
            await _db.SaveChangesAsync();
            return Ok(new { message = "Settings updated successfully", data = settings });
        }

    // ==================== NOTIFICATIONS ====================
    
        [HttpGet("notifications")]
        public async Task<IActionResult> GetAdminNotifications()
        {
            var userId = GetCurrentUserId();
            var notifications = await _db.Notifications
                .Where(n => n.UserId == userId || n.UserId == null)
                .OrderByDescending(n => n.Id)
                .Take(50)
                .ToListAsync();
    
            return Ok(new
            {
                status = "success",
                data = new
                {
                    notifications,
                    unread_count = notifications.Count(n => !n.Read)
                }
            });
        }

    [HttpPost("notifications/{id}/read")]
        public async Task<IActionResult> MarkAdminNotificationRead(ulong id)
        {
            var n = await _db.Notifications.FindAsync(id);
            if (n != null)
            {
                n.Read = true;
                n.ReadAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
            return Ok(new { status = "success" });
        }

    [HttpPost("notifications/read-all")]
        public async Task<IActionResult> MarkAllAdminNotificationsRead()
        {
            var userId = GetCurrentUserId();
            var unread = await _db.Notifications.Where(n => !n.Read && (n.UserId == userId || n.UserId == null)).ToListAsync();
            foreach (var n in unread)
            {
                n.Read = true;
                n.ReadAt = DateTime.UtcNow;
            }
            await _db.SaveChangesAsync();
            return Ok(new { status = "success" });
        }

    // ==================== BACKUPS ====================
    
        private string GetBackupsDir()
        {
            var dir = Path.Combine(_env.ContentRootPath, "Backups");
            Directory.CreateDirectory(dir);
            return dir;
        }

    [HttpPost("backups/create")]
        public async Task<IActionResult> CreateBackup()
        {
            var backupsDir = GetBackupsDir();
            var backupName = $"backup_{DateTime.UtcNow:yyyy_MM_dd_HHmmss}";
            var zipFileName = $"{backupName}.zip";
            var zipFilePath = Path.Combine(backupsDir, zipFileName);
    
            var snapshot = new
            {
                created_at = DateTime.UtcNow,
                users_count = await _db.Users.CountAsync(),
                sellers_count = await _db.Sellers.CountAsync(),
                products_count = await _db.Products.CountAsync(),
                orders_count = await _db.Orders.CountAsync(),
                settings = await _db.Settings.FirstOrDefaultAsync()
            };
    
            using (var archive = ZipFile.Open(zipFilePath, ZipArchiveMode.Create))
            {
                var entry = archive.CreateEntry("database_snapshot.json");
                using var entryStream = entry.Open();
                var bytes = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(snapshot, new JsonSerializerOptions { WriteIndented = true }));
                await entryStream.WriteAsync(bytes);
            }
    
            var fileInfo = new FileInfo(zipFilePath);
            var sizeMb = Math.Round(fileInfo.Length / 1048576.0, 2);
    
            return Ok(new
            {
                message = "تم إنشاء النسخة الاحتياطية بنجاح",
                backup_file = zipFileName,
                file_size = $"{sizeMb} MB",
                created_at = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss")
            });
        }

    [HttpGet("backups/list")]
        public IActionResult ListBackups()
        {
            var dir = new DirectoryInfo(GetBackupsDir());
            var files = dir.GetFiles("*.zip")
                .OrderByDescending(f => f.CreationTimeUtc)
                .Select(f => new
                {
                    name = f.Name,
                    size = $"{Math.Round(f.Length / 1048576.0, 2)} MB",
                    created_at = f.CreationTimeUtc.ToString("yyyy-MM-dd HH:mm:ss"),
                    path = f.FullName
                })
                .ToList();
    
            return Ok(new { backups = files, total = files.Count });
        }

    [HttpGet("backups/download/{filename}")]
        public IActionResult DownloadBackup(string filename)
        {
            var safeName = Path.GetFileName(filename);
            var path = Path.Combine(GetBackupsDir(), safeName);
            if (!System.IO.File.Exists(path))
                return NotFound(new { message = "النسخة الاحتياطية غير موجودة" });
    
            return PhysicalFile(path, "application/zip", safeName);
        }

    [HttpDelete("backups/delete/{filename}")]
        public IActionResult DeleteBackup(string filename)
        {
            var safeName = Path.GetFileName(filename);
            var path = Path.Combine(GetBackupsDir(), safeName);
            if (!System.IO.File.Exists(path))
                return NotFound(new { message = "النسخة الاحتياطية غير موجودة" });
    
            System.IO.File.Delete(path);
            return Ok(new { message = "تم حذف النسخة الاحتياطية بنجاح" });
        }
}
