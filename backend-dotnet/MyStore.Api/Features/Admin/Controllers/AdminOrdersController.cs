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

public class AdminOrdersController : AdminControllerBase
{
    public AdminOrdersController(IAppDbContext db, IDeliveryService deliveryService, IFileStorageService fileStorage, IWebHostEnvironment env) : base(db, deliveryService, fileStorage, env) { }

    // ==================== ORDERS & SMART DRIVER DISPATCH ====================
    
        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders([FromQuery] string? status = null)
        {
            var query = _db.Orders
                .Include(o => o.User)
                .Include(o => o.Driver)
                .Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p!.Seller)
                .AsQueryable();
    
            if (!string.IsNullOrEmpty(status) && status != "all")
                query = query.Where(o => o.Status == status);
    
            var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
            return Ok(orders);
        }

    [HttpGet("orders/{id}")]
        public async Task<IActionResult> GetOrder(ulong id)
        {
            var order = await _db.Orders
                .Include(o => o.User)
                .Include(o => o.Driver)
                .Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p!.Seller)
                .FirstOrDefaultAsync(o => o.Id == id);
    
            if (order == null) return NotFound(new { message = "Order not found" });
            return Ok(order);
        }

    [HttpPut("orders/{id}/status")]
        public async Task<IActionResult> UpdateOrderStatus(ulong id, [FromBody] UpdateOrderStatusRequest req)
        {
            var order = await _db.Orders.FindAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });
    
            order.Status = req.Status;
            order.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
    
            return Ok(order);
        }

    [HttpDelete("orders/{id}")]
        public async Task<IActionResult> DeleteOrder(ulong id)
        {
            var order = await _db.Orders.FindAsync(id);
            if (order == null) return NotFound(new { message = "Order not found" });
    
            _db.Orders.Remove(order);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Order deleted successfully" });
        }

    [HttpPost("orders/{id}/assign-driver")]
        public async Task<IActionResult> AssignDriver(ulong id, [FromBody] AssignDriverInput req)
        {
            var order = await _db.Orders
                .Include(o => o.User)
                .Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p!.Seller)
                .FirstOrDefaultAsync(o => o.Id == id);
    
            if (order == null)
                return NotFound(new { status = "error", message = "Order not found" });
    
            var driver = await _db.Users.FirstOrDefaultAsync(u => u.Id == req.DriverId && u.Role == "driver");
            if (driver == null)
                return BadRequest(new { status = "error", message = "Driver not found" });
    
            order.DriverId = driver.Id;
            order.DriverStatus = "assigned";
            if (order.Status == "pending")
                order.Status = "processing";
            if (string.IsNullOrEmpty(order.DeliveryCode))
                order.DeliveryCode = Random.Shared.Next(100000, 999999).ToString();
    
            order.UpdatedAt = DateTime.UtcNow;
    
            _db.Notifications.Add(new Notification
            {
                UserId = driver.Id,
                Title = "مهمة توصيل جديدة",
                Message = $"تم إسناد الطلب رقم {order.OrderNumber} إليك للتوصيل",
                Type = "order",
                Link = "/driver",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
    
            await _db.SaveChangesAsync();
    
            return Ok(new
            {
                status = "success",
                message = "Driver assigned successfully",
                data = new { order, driver }
            });
        }

    [HttpGet("orders/{id}/smart-drivers")]
        public async Task<IActionResult> GetSmartDrivers(ulong id)
        {
            var order = await _db.Orders
                .Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p!.Seller)
                .FirstOrDefaultAsync(o => o.Id == id);
    
            if (order == null)
                return NotFound(new { status = "error", message = "Order not found" });
    
            var firstSeller = order.Items.FirstOrDefault()?.Product?.Seller;
            var targetLat = firstSeller?.Latitude ?? order.Latitude;
            var targetLng = firstSeller?.Longitude ?? order.Longitude;
    
            var drivers = await _db.Users
                .Include(u => u.Driver)
                .Where(u => u.Role == "driver" && u.IsActive)
                .ToListAsync();
    
            var activeCounts = await _db.Orders
                .Where(o => o.DriverId != null && (o.DriverStatus == "assigned" || o.DriverStatus == "picked_up_from_seller" || o.DriverStatus == "out_for_delivery"))
                .GroupBy(o => o.DriverId!.Value)
                .Select(g => new { DriverId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.DriverId, x => x.Count);
    
            var result = drivers.Select(d =>
            {
                double? distKm = null;
                if (targetLat.HasValue && targetLng.HasValue && d.Latitude.HasValue && d.Longitude.HasValue)
                {
                    distKm = _deliveryService.CalculateFee((double)targetLat.Value, (double)targetLng.Value, (double)d.Latitude.Value, (double)d.Longitude.Value).DistanceKm;
                }
                var activeOrdersCount = activeCounts.TryGetValue(d.Id, out var c) ? c : 0;
                var smartStatus = d.IsOnline && activeOrdersCount == 0
                    ? "available"
                    : (d.IsOnline && activeOrdersCount > 0 ? "busy" : "offline");
    
                return new
                {
                    d.Id,
                    d.Name,
                    d.Email,
                    d.Phone,
                    d.Avatar,
                    d.IsOnline,
                    d.WorkZone,
                    d.Latitude,
                    d.Longitude,
                    active_orders_count = activeOrdersCount,
                    distance_km = distKm,
                    smart_status = smartStatus,
                    driver_profile = d.DriverProfile
                };
            })
            .OrderBy(d => d.smart_status == "available" ? 1 : (d.smart_status == "busy" ? 2 : 3))
            .ThenBy(d => d.distance_km ?? 999999)
            .ToList();
    
            return Ok(new { status = "success", data = result });
        }
}
