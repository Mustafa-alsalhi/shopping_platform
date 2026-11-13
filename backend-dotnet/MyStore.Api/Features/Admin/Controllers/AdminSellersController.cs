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

public class AdminSellersController : AdminControllerBase
{
    public AdminSellersController(IAppDbContext db, IDeliveryService deliveryService, IFileStorageService fileStorage, IWebHostEnvironment env) : base(db, deliveryService, fileStorage, env) { }

    // ==================== SELLERS CRUD ====================
    
        [HttpGet("sellers")]
        public async Task<IActionResult> GetSellers([FromQuery] string? type = null, [FromQuery] string? status = null)
        {
            var query = _db.Sellers.Include(s => s.User).AsQueryable();
            if (!string.IsNullOrEmpty(type) && type != "all")
                query = query.Where(s => s.Type == type);
            if (!string.IsNullOrEmpty(status) && status != "all")
                query = query.Where(s => s.Status == status);
    
            var sellers = await query.OrderByDescending(s => s.CreatedAt).ToListAsync();
            return Ok(sellers);
        }

    [HttpGet("sellers/{id}")]
        public async Task<IActionResult> GetSeller(ulong id)
        {
            var seller = await _db.Sellers.Include(s => s.User).FirstOrDefaultAsync(s => s.Id == id);
            if (seller == null) return NotFound(new { message = "Seller not found" });
            return Ok(seller);
        }

    [HttpPost("sellers")]
        public async Task<IActionResult> CreateSeller([FromBody] AdminSellerInput req)
        {
            var seller = new Seller
            {
                UserId = req.UserId,
                Name = req.Name,
                Description = req.Description,
                Email = req.Email,
                Phone = req.Phone,
                Address = req.Address,
                Type = req.Type ?? "store",
                Status = req.Status ?? "active",
                Verified = req.Verified ?? true,
                Featured = req.Featured ?? false,
                Latitude = req.Latitude,
                Longitude = req.Longitude,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
    
            _db.Sellers.Add(seller);
            await _db.SaveChangesAsync();
            return StatusCode(201, seller);
        }

    [HttpPut("sellers/{id}")]
        public async Task<IActionResult> UpdateSeller(ulong id, [FromBody] AdminSellerInput req)
        {
            var seller = await _db.Sellers.FindAsync(id);
            if (seller == null) return NotFound(new { message = "Seller not found" });
    
            if (!string.IsNullOrEmpty(req.Name)) seller.Name = req.Name;
            if (req.Description != null) seller.Description = req.Description;
            if (req.Email != null) seller.Email = req.Email;
            if (req.Phone != null) seller.Phone = req.Phone;
            if (req.Address != null) seller.Address = req.Address;
            if (!string.IsNullOrEmpty(req.Type)) seller.Type = req.Type;
            if (!string.IsNullOrEmpty(req.Status)) seller.Status = req.Status;
            if (req.Verified.HasValue) seller.Verified = req.Verified.Value;
            if (req.Featured.HasValue) seller.Featured = req.Featured.Value;
            if (req.Latitude.HasValue) seller.Latitude = req.Latitude.Value;
            if (req.Longitude.HasValue) seller.Longitude = req.Longitude.Value;
            seller.UpdatedAt = DateTime.UtcNow;
    
            await _db.SaveChangesAsync();
            return Ok(seller);
        }

    [HttpDelete("sellers/{id}")]
        public async Task<IActionResult> DeleteSeller(ulong id)
        {
            var seller = await _db.Sellers.FindAsync(id);
            if (seller == null) return NotFound(new { message = "Seller not found" });
    
            _db.Sellers.Remove(seller);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Seller deleted" });
        }
}
