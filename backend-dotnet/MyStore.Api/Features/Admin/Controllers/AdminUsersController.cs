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

public class AdminUsersController : AdminControllerBase
{
    public AdminUsersController(IAppDbContext db, IDeliveryService deliveryService, IFileStorageService fileStorage, IWebHostEnvironment env) : base(db, deliveryService, fileStorage, env) { }

    // ==================== USERS CRUD ====================
    
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] string? role = null, [FromQuery] string? search = null)
        {
            var query = _db.Users.AsQueryable();
            if (!string.IsNullOrEmpty(role) && role != "all")
                query = query.Where(u => u.Role == role);
    
            if (!string.IsNullOrEmpty(search))
                query = query.Where(u => u.Name.Contains(search) || (u.Email != null && u.Email.Contains(search)) || (u.Phone != null && u.Phone.Contains(search)));
    
            var users = await query.OrderByDescending(u => u.CreatedAt).ToListAsync();
            return Ok(users);
        }

    [HttpGet("users/{id}")]
        public async Task<IActionResult> GetUser(ulong id)
        {
            var user = await _db.Users
                .Include(u => u.Seller)
                .Include(u => u.Driver)
                .FirstOrDefaultAsync(u => u.Id == id);
    
            if (user == null) return NotFound(new { message = "User not found" });
            return Ok(user);
        }

    [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] AdminUserInput req)
        {
            if (await _db.Users.AnyAsync(u => u.Email == req.Email))
                return BadRequest(new { message = "Email already exists" });
    
            var user = new User
            {
                Name = req.Name,
                Email = req.Email,
                Phone = req.Phone,
                Password = BCrypt.Net.BCrypt.HashPassword(req.Password ?? "12345678"),
                Role = req.Role ?? "customer",
                IsActive = req.IsActive ?? true,
                IsVerified = true,
                EmailVerifiedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
    
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
    
            return StatusCode(201, user);
        }

    [HttpPut("users/{id}")]
        public async Task<IActionResult> UpdateUser(ulong id, [FromBody] AdminUserInput req)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found" });
    
            if (!string.IsNullOrEmpty(req.Name)) user.Name = req.Name;
            if (!string.IsNullOrEmpty(req.Email)) user.Email = req.Email;
            if (req.Phone != null) user.Phone = req.Phone;
            if (!string.IsNullOrEmpty(req.Role)) user.Role = req.Role;
            if (req.IsActive.HasValue) user.IsActive = req.IsActive.Value;
            if (!string.IsNullOrEmpty(req.Password))
                user.Password = BCrypt.Net.BCrypt.HashPassword(req.Password);
    
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
    
            return Ok(user);
        }

    [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(ulong id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "User not found" });
    
            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
            return Ok(new { message = "User deleted successfully" });
        }
}
