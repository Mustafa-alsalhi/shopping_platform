using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;
using MyStore.Api.Features.Driver.Dtos;

namespace MyStore.Api.Features.Driver.Controllers;

[ApiController]
[Route("api/driver")]
[Authorize]
public class DriverPortalController : ControllerBase
{
    private readonly IAppDbContext _db;
    private readonly IDeliveryService _deliveryService;
    private readonly IFileStorageService _fileStorage;

    public DriverPortalController(IAppDbContext db, IDeliveryService deliveryService, IFileStorageService fileStorage)
    {
        _db = db;
        _deliveryService = deliveryService;
        _fileStorage = fileStorage;
    }

    private ulong? GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return ulong.TryParse(claim, out var id) ? id : null;
    }

    [HttpGet("orders")]
    public async Task<IActionResult> GetAssignedOrders()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var orders = await _db.Orders
            .Include(o => o.User)
            .Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p!.Seller)
            .Where(o => o.DriverId == userId.Value && o.DriverStatus != "delivered" && o.Status != "delivered" && o.Status != "cancelled")
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(new { status = "success", data = orders });
    }

    [HttpGet("orders/completed")]
    public async Task<IActionResult> GetCompletedOrders()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var orders = await _db.Orders
            .Include(o => o.User)
            .Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p!.Seller)
            .Where(o => o.DriverId == userId.Value && (o.DriverStatus == "delivered" || o.Status == "delivered"))
            .OrderByDescending(o => o.UpdatedAt)
            .ToListAsync();

        return Ok(new { status = "success", data = orders });
    }

    [HttpGet("orders/{id}")]
    public async Task<IActionResult> GetDriverOrderDetails(ulong id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var order = await _db.Orders
            .Include(o => o.User)
            .Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p!.Seller)
            .FirstOrDefaultAsync(o => o.Id == id && (o.DriverId == userId.Value || User.IsInRole("admin")));

        if (order == null)
            return NotFound(new { status = "error", message = "Order not found" });

        return Ok(new { status = "success", data = order });
    }

    [HttpPut("orders/{id}/status")]
    public async Task<IActionResult> UpdateDriverOrderStatus(ulong id, [FromBody] DriverOrderStatusInput req)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var order = await _db.Orders
            .Include(o => o.User)
            .Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p!.Seller)
            .FirstOrDefaultAsync(o => o.Id == id && (o.DriverId == userId.Value || User.IsInRole("admin")));

        if (order == null)
            return NotFound(new { status = "error", message = "الطلب غير موجود" });

        var targetStatus = req.DriverStatus ?? req.Status ?? "";

        if (targetStatus == "delivered")
        {
            if (!string.IsNullOrEmpty(order.DeliveryCode) && order.DeliveryCode != req.DeliveryCode)
            {
                return BadRequest(new { status = "error", message = "كود التسليم غير صحيح. يرجى طلب الكود الصحيح من العميل." });
            }

            order.DriverStatus = "delivered";
            order.Status = "delivered";
            order.PaymentStatus = "paid";
            order.DeliveredAt = DateTime.UtcNow;

            var driverProfile = await _db.Drivers.FirstOrDefaultAsync(d => d.UserId == userId.Value);
            if (driverProfile != null)
            {
                driverProfile.CompletedDeliveries += 1;
                driverProfile.TotalDeliveries += 1;
                driverProfile.TotalEarnings += Math.Round(order.Shipping * 0.80m, 2);
            }
        }
        else if (targetStatus == "picked_up_from_seller")
        {
            order.DriverStatus = "picked_up_from_seller";
            order.Status = "shipped";
        }
        else if (targetStatus == "out_for_delivery")
        {
            order.DriverStatus = "out_for_delivery";
            order.Status = "shipped";
        }
        else
        {
            order.DriverStatus = targetStatus;
        }

        order.UpdatedAt = DateTime.UtcNow;

        _db.Notifications.Add(new Notification
        {
            UserId = order.UserId,
            Title = "تحديث حالة التوصيل",
            Message = targetStatus == "delivered"
                ? $"تم تسليم طلبك رقم {order.OrderNumber} بنجاح!"
                : $"مندوب التوصيل قام بتحديث حالة طلبك رقم {order.OrderNumber}",
            Type = "order",
            Link = $"/orders/{order.Id}",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        await _db.SaveChangesAsync();

        return Ok(new { status = "success", message = "تم تحديث حالة التوصيل بنجاح", data = order });
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetDriverProfile()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var user = await _db.Users
            .Include(u => u.Driver)
            .FirstOrDefaultAsync(u => u.Id == userId.Value);

        if (user == null) return NotFound();

        return Ok(new
        {
            status = "success",
            data = new
            {
                user.Id,
                user.Name,
                user.Email,
                user.Phone,
                user.Avatar,
                user.IsOnline,
                user.WorkZone,
                user.Latitude,
                user.Longitude,
                driver_profile = user.DriverProfile
            }
        });
    }

    [HttpPut("profile/status")]
    public async Task<IActionResult> UpdateDriverOnlineStatus([FromBody] DriverStatusUpdateInput req)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var user = await _db.Users.Include(u => u.Driver).FirstOrDefaultAsync(u => u.Id == userId.Value);
        if (user == null) return NotFound();

        if (req.IsOnline.HasValue)
            user.IsOnline = req.IsOnline.Value;

        if (!string.IsNullOrEmpty(req.WorkZone))
            user.WorkZone = req.WorkZone;

        if (req.Latitude.HasValue)
            user.Latitude = req.Latitude.Value;

        if (req.Longitude.HasValue)
            user.Longitude = req.Longitude.Value;

        if (user.DriverProfile != null)
        {
            if (!string.IsNullOrEmpty(req.Status))
                user.DriverProfile.Status = req.Status;
            else if (req.IsOnline.HasValue)
                user.DriverProfile.Status = req.IsOnline.Value ? "available" : "offline";

            if (req.Latitude.HasValue && req.Longitude.HasValue)
            {
                user.DriverProfile.CurrentLocation = $"{{\"lat\":{req.Latitude.Value},\"lng\":{req.Longitude.Value}}}";
            }
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { status = "success", message = "تم تحديث الحالة والموقع بنجاح", data = user });
    }

    [HttpPost("settings")]
    public async Task<IActionResult> UpdateDriverSettings(
        [FromForm] string? name,
        [FromForm] string? phone,
        [FromForm] string? work_zone,
        [FromForm] string? vehicle_type,
        [FromForm] string? vehicle_number,
        [FromForm] string? license_number,
        [FromForm] string? national_id,
        IFormFile? avatar,
        IFormFile? license_image,
        IFormFile? id_image)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var user = await _db.Users.Include(u => u.Driver).FirstOrDefaultAsync(u => u.Id == userId.Value);
        if (user == null) return NotFound();

        if (!string.IsNullOrEmpty(name)) user.Name = name;
        if (!string.IsNullOrEmpty(phone)) user.Phone = phone;
        if (work_zone != null) user.WorkZone = work_zone;

        if (avatar != null && avatar.Length > 0)
        {
            using var stream = avatar.OpenReadStream();
            user.Avatar = await _fileStorage.SaveFileAsync(stream, avatar.FileName, "avatars");
        }

        if (user.DriverProfile == null)
        {
            user.DriverProfile = new MyStore.Domain.Entities.Driver
            {
                UserId = user.Id,
                VehicleType = vehicle_type ?? "motorcycle",
                VehicleNumber = vehicle_number ?? "",
                LicenseNumber = license_number ?? "",
                NationalId = national_id,
                Status = user.IsOnline ? "available" : "offline",
                IsVerified = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Drivers.Add(user.DriverProfile);
        }
        else
        {
            if (!string.IsNullOrEmpty(vehicle_type)) user.DriverProfile.VehicleType = vehicle_type;
            if (!string.IsNullOrEmpty(vehicle_number)) user.DriverProfile.VehicleNumber = vehicle_number;
            if (!string.IsNullOrEmpty(license_number)) user.DriverProfile.LicenseNumber = license_number;
            if (!string.IsNullOrEmpty(national_id)) user.DriverProfile.NationalId = national_id;
        }

        if (license_image != null && license_image.Length > 0)
        {
            using var stream = license_image.OpenReadStream();
            user.DriverProfile.LicenseImage = await _fileStorage.SaveFileAsync(stream, license_image.FileName, "drivers");
        }

        if (id_image != null && id_image.Length > 0)
        {
            using var stream = id_image.OpenReadStream();
            user.DriverProfile.IdImage = await _fileStorage.SaveFileAsync(stream, id_image.FileName, "drivers");
        }

        await _db.SaveChangesAsync();

        return Ok(new { status = "success", message = "تم تحديث إعدادات المندوب بنجاح", data = user });
    }

    [HttpGet("nearby-stores")]
    public async Task<IActionResult> GetNearbyStores([FromQuery] double? lat = null, [FromQuery] double? lng = null)
    {
        var sellers = await _db.Sellers
            .Where(s => s.Status == "active" && s.Latitude != null && s.Longitude != null)
            .ToListAsync();

        var result = sellers.Select(s =>
        {
            double? distKm = null;
            if (lat.HasValue && lng.HasValue && s.Latitude.HasValue && s.Longitude.HasValue)
            {
                distKm = _deliveryService.CalculateFee(lat.Value, lng.Value, (double)s.Latitude.Value, (double)s.Longitude.Value).DistanceKm;
            }
            return new
            {
                s.Id,
                s.Name,
                s.Type,
                s.Logo,
                s.Address,
                s.Phone,
                s.Latitude,
                s.Longitude,
                s.IsOpen,
                distance_km = distKm
            };
        })
        .OrderBy(s => s.distance_km ?? 999999)
        .ToList();

        return Ok(new { status = "success", data = result });
    }

    [HttpGet("statistics")]
    public async Task<IActionResult> GetDriverStatistics()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var driverOrders = await _db.Orders.Where(o => o.DriverId == userId.Value).ToListAsync();
        var completed = driverOrders.Where(o => o.DriverStatus == "delivered" || o.Status == "delivered").ToList();
        var active = driverOrders.Where(o => o.DriverStatus != "delivered" && o.Status != "delivered" && o.Status != "cancelled").ToList();

        var totalShipping = completed.Sum(o => o.Shipping);
        var netProfit = Math.Round(totalShipping * 0.80m, 2);

        return Ok(new
        {
            status = "success",
            data = new
            {
                total_assigned = driverOrders.Count,
                active_orders = active.Count,
                completed_orders = completed.Count,
                total_delivery_fees = totalShipping,
                net_profit = netProfit,
                today_completed = completed.Count(o => (o.DeliveredAt ?? o.UpdatedAt)?.Date == DateTime.UtcNow.Date),
                today_earnings = Math.Round(completed.Where(o => (o.DeliveredAt ?? o.UpdatedAt)?.Date == DateTime.UtcNow.Date).Sum(o => o.Shipping) * 0.80m, 2)
            }
        });
    }
}
