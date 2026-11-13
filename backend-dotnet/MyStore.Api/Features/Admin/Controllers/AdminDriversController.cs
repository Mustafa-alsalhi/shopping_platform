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

public class AdminDriversController : AdminControllerBase
{
    public AdminDriversController(IAppDbContext db, IDeliveryService deliveryService, IFileStorageService fileStorage, IWebHostEnvironment env) : base(db, deliveryService, fileStorage, env) { }

    // ==================== DRIVERS CRUD ====================
    
        [HttpGet("drivers")]
        public async Task<IActionResult> GetDrivers()
        {
            var drivers = await _db.Users
                .Include(u => u.Driver)
                .Where(u => u.Role == "driver")
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();
    
            return Ok(new { status = "success", data = drivers });
        }

    [HttpGet("drivers/statistics")]
        public async Task<IActionResult> GetDriversStatistics()
        {
            var drivers = await _db.Users.Where(u => u.Role == "driver").ToListAsync();
            var activeDeliveries = await _db.Orders.CountAsync(o => o.DriverId != null && o.DriverStatus != "delivered" && o.Status != "cancelled");
    
            return Ok(new
            {
                status = "success",
                data = new
                {
                    total_drivers = drivers.Count,
                    online_drivers = drivers.Count(d => d.IsOnline),
                    active_drivers = drivers.Count(d => d.IsActive),
                    active_deliveries = activeDeliveries
                }
            });
        }

    [HttpGet("drivers/{id}")]
        public async Task<IActionResult> GetDriver(ulong id)
        {
            var driver = await _db.Users
                .Include(u => u.Driver)
                .FirstOrDefaultAsync(u => u.Id == id && u.Role == "driver");
    
            if (driver == null) return NotFound(new { message = "Driver not found" });
            return Ok(new { status = "success", data = driver });
        }

    [HttpPost("drivers")]
        public async Task<IActionResult> CreateDriver([FromBody] AdminDriverInput req)
        {
            var user = new User
            {
                Name = req.Name,
                Email = req.Email,
                Phone = req.Phone,
                Password = BCrypt.Net.BCrypt.HashPassword(req.Password ?? "12345678"),
                Role = "driver",
                WorkZone = req.WorkZone,
                IsActive = true,
                IsVerified = true,
                EmailVerifiedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
    
            _db.Users.Add(user);
            await _db.SaveChangesAsync();
    
            var driverProfile = new Driver
            {
                UserId = user.Id,
                VehicleType = req.VehicleType ?? "motorcycle",
                VehicleNumber = req.VehicleNumber ?? "",
                LicenseNumber = req.LicenseNumber ?? "",
                NationalId = req.NationalId,
                Status = "offline",
                IsVerified = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
    
            _db.Drivers.Add(driverProfile);
            await _db.SaveChangesAsync();
    
            return StatusCode(201, new { status = "success", data = user });
        }

    [HttpPut("drivers/{id}")]
        public async Task<IActionResult> UpdateDriver(ulong id, [FromBody] AdminDriverInput req)
        {
            var user = await _db.Users.Include(u => u.Driver).FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound(new { message = "Driver not found" });
    
            if (!string.IsNullOrEmpty(req.Name)) user.Name = req.Name;
            if (!string.IsNullOrEmpty(req.Email)) user.Email = req.Email;
            if (req.Phone != null) user.Phone = req.Phone;
            if (req.WorkZone != null) user.WorkZone = req.WorkZone;
            if (req.IsActive.HasValue) user.IsActive = req.IsActive.Value;
    
            if (user.DriverProfile != null)
            {
                if (!string.IsNullOrEmpty(req.VehicleType)) user.DriverProfile.VehicleType = req.VehicleType;
                if (!string.IsNullOrEmpty(req.VehicleNumber)) user.DriverProfile.VehicleNumber = req.VehicleNumber;
                if (!string.IsNullOrEmpty(req.LicenseNumber)) user.DriverProfile.LicenseNumber = req.LicenseNumber;
                if (req.NationalId != null) user.DriverProfile.NationalId = req.NationalId;
            }
    
            await _db.SaveChangesAsync();
            return Ok(new { status = "success", data = user });
        }

    [HttpDelete("drivers/{id}")]
        public async Task<IActionResult> DeleteDriver(ulong id)
        {
            var user = await _db.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "Driver not found" });
    
            _db.Users.Remove(user);
            await _db.SaveChangesAsync();
            return Ok(new { status = "success", message = "Driver deleted" });
        }
}
