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

public class AdminCatalogController : AdminControllerBase
{
    public AdminCatalogController(IAppDbContext db, IDeliveryService deliveryService, IFileStorageService fileStorage, IWebHostEnvironment env) : base(db, deliveryService, fileStorage, env) { }

    // ==================== CATEGORIES & ACTIVITIES ====================
    
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories([FromQuery] string? type = null)
        {
            var query = _db.Categories.AsQueryable();
            if (!string.IsNullOrEmpty(type) && type != "all")
                query = query.Where(c => c.Type == type);
    
            var categories = await query.OrderByDescending(c => c.CreatedAt).ToListAsync();
            return Ok(categories);
        }

    [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory([FromBody] CategoryInput req)
        {
            var slug = !string.IsNullOrEmpty(req.Slug)
                ? req.Slug
                : $"{req.Name.ToLowerInvariant().Replace(" ", "-")}-{Random.Shared.Next(100, 999)}";
    
            var cat = new Category
            {
                Name = req.Name,
                Slug = slug,
                Description = req.Description,
                Image = req.Image,
                Status = req.Status ?? "active",
                Featured = req.Featured ?? false,
                Type = req.Type ?? "store",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
    
            _db.Categories.Add(cat);
            await _db.SaveChangesAsync();
            return StatusCode(201, cat);
        }

    [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateCategory(ulong id, [FromBody] CategoryInput req)
        {
            var cat = await _db.Categories.FindAsync(id);
            if (cat == null) return NotFound(new { message = "Category not found" });
    
            if (!string.IsNullOrEmpty(req.Name)) cat.Name = req.Name;
            if (!string.IsNullOrEmpty(req.Slug)) cat.Slug = req.Slug;
            if (req.Description != null) cat.Description = req.Description;
            if (req.Image != null) cat.Image = req.Image;
            if (!string.IsNullOrEmpty(req.Status)) cat.Status = req.Status;
            if (req.Featured.HasValue) cat.Featured = req.Featured.Value;
            if (!string.IsNullOrEmpty(req.Type)) cat.Type = req.Type;
            cat.UpdatedAt = DateTime.UtcNow;
    
            await _db.SaveChangesAsync();
            return Ok(cat);
        }

    [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteCategory(ulong id)
        {
            var cat = await _db.Categories.FindAsync(id);
            if (cat == null) return NotFound(new { message = "Category not found" });
    
            _db.Categories.Remove(cat);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Category deleted" });
        }

    [HttpPost("categories/upload-image")]
        public async Task<IActionResult> UploadCategoryImage(IFormFile? image)
        {
            if (image == null || image.Length == 0)
                return BadRequest(new { message = "يرجى اختيار صورة" });
    
            using var s = image.OpenReadStream();
            var path = await _fileStorage.SaveFileAsync(s, image.FileName, "categories");
            return Ok(new { image_url = path, data = new { image_url = path } });
        }

    [HttpGet("activities")]
        public async Task<IActionResult> GetActivities()
        {
            var list = await _db.Activities.OrderBy(a => a.SortOrder).ToListAsync();
            return Ok(new { success = true, data = list });
        }

    [HttpPost("activities")]
        public async Task<IActionResult> CreateActivity([FromBody] ActivityInput req)
        {
            var act = new Activity
            {
                Name = req.Name,
                Slug = !string.IsNullOrEmpty(req.Slug) ? req.Slug : req.Name.ToLowerInvariant().Replace(" ", "-"),
                Icon = req.Icon,
                Description = req.Description,
                Image = req.Image,
                IsActive = req.IsActive ?? true,
                SortOrder = req.SortOrder ?? 0,
                ThemeColor = req.ThemeColor,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
    
            _db.Activities.Add(act);
            await _db.SaveChangesAsync();
            return StatusCode(201, new { success = true, data = act });
        }

    [HttpPut("activities/{id}")]
        public async Task<IActionResult> UpdateActivity(ulong id, [FromBody] ActivityInput req)
        {
            var act = await _db.Activities.FindAsync(id);
            if (act == null) return NotFound(new { message = "Activity not found" });
    
            if (!string.IsNullOrEmpty(req.Name)) act.Name = req.Name;
            if (!string.IsNullOrEmpty(req.Slug)) act.Slug = req.Slug;
            if (req.Icon != null) act.Icon = req.Icon;
            if (req.Description != null) act.Description = req.Description;
            if (req.Image != null) act.Image = req.Image;
            if (req.IsActive.HasValue) act.IsActive = req.IsActive.Value;
            if (req.SortOrder.HasValue) act.SortOrder = req.SortOrder.Value;
            if (req.ThemeColor != null) act.ThemeColor = req.ThemeColor;
            act.UpdatedAt = DateTime.UtcNow;
    
            await _db.SaveChangesAsync();
            return Ok(new { success = true, data = act });
        }

    [HttpPatch("activities/{id}/toggle")]
        public async Task<IActionResult> ToggleActivity(ulong id)
        {
            var act = await _db.Activities.FindAsync(id);
            if (act == null) return NotFound(new { message = "Activity not found" });
    
            act.IsActive = !act.IsActive;
            act.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { success = true, data = act });
        }

    [HttpDelete("activities/{id}")]
        public async Task<IActionResult> DeleteActivity(ulong id)
        {
            var act = await _db.Activities.FindAsync(id);
            if (act == null) return NotFound(new { message = "Activity not found" });
            if (act.IsSystem) return BadRequest(new { message = "Cannot delete system activity" });
    
            _db.Activities.Remove(act);
            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Activity deleted" });
        }
}
