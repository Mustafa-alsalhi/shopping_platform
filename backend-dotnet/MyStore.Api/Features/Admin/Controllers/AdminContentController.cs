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

public class AdminContentController : AdminControllerBase
{
    public AdminContentController(IAppDbContext db, IDeliveryService deliveryService, IFileStorageService fileStorage, IWebHostEnvironment env) : base(db, deliveryService, fileStorage, env) { }

    // ==================== ABOUT US, CONTACT US, POLICIES, SETTINGS ====================
    
        [HttpGet("about-us")]
        public async Task<IActionResult> GetAboutUs()
        {
            return Ok(await _db.AboutUsPages.FirstOrDefaultAsync());
        }

    [HttpGet("about-us/{id}")]
        public async Task<IActionResult> GetAboutUsById(ulong id)
        {
            var about = await _db.AboutUsPages.FindAsync(id);
            if (about == null) return NotFound();
            return Ok(about);
        }

    [HttpPost("about-us")]
        public async Task<IActionResult> CreateAboutUs([FromForm] AboutUs req, IFormFile? image)
        {
            if (image != null && image.Length > 0)
            {
                using var s = image.OpenReadStream();
                req.ImagePath = await _fileStorage.SaveFileAsync(s, image.FileName, "about-us");
            }
            req.CreatedAt = DateTime.UtcNow;
            req.UpdatedAt = DateTime.UtcNow;
            _db.AboutUsPages.Add(req);
            await _db.SaveChangesAsync();
            return StatusCode(201, req);
        }

    [HttpPut("about-us/{id}")]
        [HttpPost("about-us/{id}")]
        public async Task<IActionResult> UpdateAboutUs(ulong id, [FromForm] AboutUs req, IFormFile? image)
        {
            var about = await _db.AboutUsPages.FindAsync(id);
            if (about == null) return NotFound();
    
            about.Title = req.Title ?? about.Title;
            about.Description = req.Description ?? about.Description;
            about.Mission = req.Mission ?? about.Mission;
            about.Vision = req.Vision ?? about.Vision;
            about.Email = req.Email ?? about.Email;
            about.Phone = req.Phone ?? about.Phone;
            about.Address = req.Address ?? about.Address;
            about.IsActive = req.IsActive;
    
            if (image != null && image.Length > 0)
            {
                using var s = image.OpenReadStream();
                about.ImagePath = await _fileStorage.SaveFileAsync(s, image.FileName, "about-us");
            }
    
            about.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(about);
        }

    [HttpDelete("about-us/{id}")]
        public async Task<IActionResult> DeleteAboutUs(ulong id)
        {
            var about = await _db.AboutUsPages.FindAsync(id);
            if (about != null)
            {
                _db.AboutUsPages.Remove(about);
                await _db.SaveChangesAsync();
            }
            return Ok(new { message = "About Us deleted successfully" });
        }

    [HttpGet("contact-us")]
        public async Task<IActionResult> GetContactUsList()
        {
            return Ok(await _db.ContactUsMessages.OrderByDescending(c => c.CreatedAt).ToListAsync());
        }

    [HttpGet("contact-us/statistics")]
        public async Task<IActionResult> GetContactUsStats()
        {
            var list = await _db.ContactUsMessages.ToListAsync();
            return Ok(new
            {
                total = list.Count,
                pending = list.Count(c => c.Status == "pending"),
                read = list.Count(c => c.Status == "read"),
                replied = list.Count(c => c.Status == "replied"),
                closed = list.Count(c => c.Status == "closed")
            });
        }

    [HttpGet("contact-us/status/{status}")]
        public async Task<IActionResult> GetContactUsByStatus(string status)
        {
            var list = await _db.ContactUsMessages.Where(c => c.Status == status).OrderByDescending(c => c.CreatedAt).ToListAsync();
            return Ok(list);
        }

    [HttpGet("contact-us/{id}")]
        public async Task<IActionResult> GetContactUsItem(ulong id)
        {
            var item = await _db.ContactUsMessages.FindAsync(id);
            if (item == null) return NotFound();
            if (!item.ReadAt.HasValue)
            {
                item.ReadAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
            return Ok(item);
        }

    [HttpPut("contact-us/{id}")]
        public async Task<IActionResult> UpdateContactUsItem(ulong id, [FromBody] UpdateContactUsInput req)
        {
            var item = await _db.ContactUsMessages.FindAsync(id);
            if (item == null) return NotFound();
    
            item.Status = req.Status;
            item.AdminReply = req.AdminReply ?? item.AdminReply;
            if (req.Status == "read" && !item.ReadAt.HasValue) item.ReadAt = DateTime.UtcNow;
            if (req.Status == "replied" && !item.RepliedAt.HasValue)
            {
                item.RepliedAt = DateTime.UtcNow;
                item.ReadAt ??= DateTime.UtcNow;
            }
            item.UpdatedAt = DateTime.UtcNow;
    
            await _db.SaveChangesAsync();
            return Ok(new { contact = item, message = "تم تحديث الرسالة بنجاح", email_sent = true });
        }

    [HttpPatch("contact-us/{id}/read")]
        public async Task<IActionResult> MarkContactRead(ulong id)
        {
            var item = await _db.ContactUsMessages.FindAsync(id);
            if (item == null) return NotFound();
            item.ReadAt ??= DateTime.UtcNow;
            item.Status = "read";
            await _db.SaveChangesAsync();
            return Ok(item);
        }

    [HttpPatch("contact-us/{id}/replied")]
        public async Task<IActionResult> MarkContactReplied(ulong id)
        {
            var item = await _db.ContactUsMessages.FindAsync(id);
            if (item == null) return NotFound();
            item.RepliedAt ??= DateTime.UtcNow;
            item.ReadAt ??= DateTime.UtcNow;
            item.Status = "replied";
            await _db.SaveChangesAsync();
            return Ok(item);
        }

    [HttpPatch("contact-us/{id}/closed")]
        public async Task<IActionResult> MarkContactClosed(ulong id)
        {
            var item = await _db.ContactUsMessages.FindAsync(id);
            if (item == null) return NotFound();
            item.Status = "closed";
            await _db.SaveChangesAsync();
            return Ok(item);
        }

    [HttpDelete("contact-us/{id}")]
        public async Task<IActionResult> DeleteContactUs(ulong id)
        {
            var item = await _db.ContactUsMessages.FindAsync(id);
            if (item != null)
            {
                _db.ContactUsMessages.Remove(item);
                await _db.SaveChangesAsync();
            }
            return Ok(new { message = "Contact deleted successfully" });
        }

    [HttpGet("policies")]
        public async Task<IActionResult> GetPolicies()
        {
            return Ok(new { data = await _db.Policies.ToListAsync() });
        }

    [HttpPost("policies")]
        public async Task<IActionResult> CreatePolicy([FromBody] Policy req)
        {
            req.CreatedAt = DateTime.UtcNow;
            req.UpdatedAt = DateTime.UtcNow;
            _db.Policies.Add(req);
            await _db.SaveChangesAsync();
            return StatusCode(201, new { message = "Policy created successfully", data = req });
        }

    [HttpPut("policies/{id}")]
        public async Task<IActionResult> UpdatePolicy(ulong id, [FromBody] Policy req)
        {
            var policy = await _db.Policies.FindAsync(id);
            if (policy == null) return NotFound();
    
            policy.Type = req.Type ?? policy.Type;
            policy.Title = req.Title ?? policy.Title;
            policy.Description = req.Description ?? policy.Description;
            policy.Content = req.Content ?? policy.Content;
            policy.IsActive = req.IsActive;
            policy.UpdatedAt = DateTime.UtcNow;
    
            await _db.SaveChangesAsync();
            return Ok(new { message = "Policy updated successfully", data = policy });
        }

    [HttpDelete("policies/{id}")]
        public async Task<IActionResult> DeletePolicy(ulong id)
        {
            var policy = await _db.Policies.FindAsync(id);
            if (policy != null)
            {
                _db.Policies.Remove(policy);
                await _db.SaveChangesAsync();
            }
            return Ok(new { message = "Policy deleted successfully" });
        }
}
