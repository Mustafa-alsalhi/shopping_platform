using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Api.Helpers;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;
using MyStore.Api.Features.PromotionsAndCms.Dtos;

namespace MyStore.Api.Features.PromotionsAndCms.Controllers;

[ApiController]
[Route("api")]
public class PromotionsAndCmsController : ControllerBase
{
    private readonly IAppDbContext _db;
    private readonly IFileStorageService _fileStorage;
    private readonly IWebHostEnvironment _env;

    public PromotionsAndCmsController(IAppDbContext db, IFileStorageService fileStorage, IWebHostEnvironment env)
    {
        _db = db;
        _fileStorage = fileStorage;
        _env = env;
    }

    private ulong? GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return ulong.TryParse(claim, out var id) ? id : null;
    }

    // ==================== COUPONS ====================

    [HttpGet("coupons/active")]
    public async Task<IActionResult> GetActiveCoupons()
    {
        var now = DateTime.UtcNow;
        var coupons = await _db.Coupons
            .Where(c => c.IsActive &&
                        (!c.StartsAt.HasValue || c.StartsAt <= now) &&
                        (!c.ExpiresAt.HasValue || c.ExpiresAt >= now) &&
                        (!c.UsageLimit.HasValue || c.UsedCount < c.UsageLimit.Value))
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        return Ok(new { status = "success", data = coupons });
    }

    [HttpGet("sellers/{sellerId}/coupons")]
    public async Task<IActionResult> GetSellerPublicCoupons(ulong sellerId)
    {
        var now = DateTime.UtcNow;
        var coupons = await _db.Coupons
            .Where(c => c.SellerId == sellerId && c.IsActive &&
                        (!c.StartsAt.HasValue || c.StartsAt <= now) &&
                        (!c.ExpiresAt.HasValue || c.ExpiresAt >= now) &&
                        (!c.UsageLimit.HasValue || c.UsedCount < c.UsageLimit.Value))
            .ToListAsync();

        return Ok(new { status = "success", data = coupons });
    }

    [HttpPost("coupons/validate")]
    public async Task<IActionResult> ValidateCoupon([FromBody] ValidateCouponRequest req)
    {
        var code = req.Code?.Trim().ToUpperInvariant() ?? "";
        var coupon = await _db.Coupons.FirstOrDefaultAsync(c => c.Code.ToUpper() == code);

        if (coupon == null || !coupon.IsActive)
            return BadRequest(new { status = "error", message = "كود الخصم غير صالح أو غير مفعل" });

        var now = DateTime.UtcNow;
        if (coupon.StartsAt.HasValue && coupon.StartsAt.Value > now)
            return BadRequest(new { status = "error", message = "كود الخصم لم يبدأ بعد" });

        if (coupon.ExpiresAt.HasValue && coupon.ExpiresAt.Value < now)
            return BadRequest(new { status = "error", message = "كود الخصم منتهي الصلاحية" });

        if (coupon.MaxUses.HasValue && coupon.UsedCount >= coupon.MaxUses.Value)
            return BadRequest(new { status = "error", message = "تم استنفاد الحد الأقصى لاستخدام هذا الكوبون" });

        if (coupon.MinOrderAmount.HasValue && req.OrderAmount < coupon.MinOrderAmount.Value)
            return BadRequest(new { status = "error", message = $"الحد الأدنى للطلب لاستخدام هذا الكوبون هو {coupon.MinOrderAmount.Value}" });

        decimal discountAmount = coupon.Type == "percentage"
            ? Math.Round(req.OrderAmount * (coupon.Value / 100m), 2)
            : coupon.Value;

        discountAmount = Math.Min(discountAmount, req.OrderAmount);

        return Ok(new
        {
            status = "success",
            message = "كود الخصم صالح",
            data = new
            {
                coupon,
                discount_amount = discountAmount,
                final_amount = Math.Max(0m, req.OrderAmount - discountAmount)
            }
        });
    }

    [HttpPost("coupons/apply")]
    public async Task<IActionResult> ApplyCoupon([FromBody] ValidateCouponRequest req)
    {
        var result = await ValidateCoupon(req);
        if (result is OkObjectResult)
        {
            var code = req.Code?.Trim().ToUpperInvariant() ?? "";
            var coupon = await _db.Coupons.FirstOrDefaultAsync(c => c.Code.ToUpper() == code);
            if (coupon != null)
            {
                coupon.UsedCount += 1;
                await _db.SaveChangesAsync();
            }
        }
        return result;
    }

    // ==================== OFFERS ====================

    [HttpGet("offers")]
    public async Task<IActionResult> GetOffers([FromQuery] string? category = null, [FromQuery] string? type = null)
    {
        var query = _db.Offers
            .Include(o => o.Seller)
            .Include(o => o.OfferProducts).ThenInclude(op => op.Product)
            .Where(o => o.Status == "active");

        if (!string.IsNullOrEmpty(category) && category != "all")
            query = query.Where(o => o.DiscountType == category);

        if (!string.IsNullOrEmpty(type) && type != "all")
        {
            if (type == "store" || type == "stores")
                query = query.Where(o => o.Seller == null || o.Seller.Type == "store" || o.Seller.Type == "stores" || o.Seller.Type == null);
            else
                query = query.Where(o => o.Seller != null && o.Seller.Type == type);
        }

        var offers = await query.OrderByDescending(o => o.ShowInHome).ThenByDescending(o => o.CreatedAt).ToListAsync();
        return Ok(offers.Select(FormatOffer));
    }

    [HttpGet("offers/featured")]
    public async Task<IActionResult> GetFeaturedOffers([FromQuery] string? type = null)
    {
        var query = _db.Offers
            .Include(o => o.Seller)
            .Include(o => o.OfferProducts).ThenInclude(op => op.Product)
            .Where(o => o.Status == "active" && o.ShowInHome);

        if (!string.IsNullOrEmpty(type) && type != "all")
        {
            if (type == "store" || type == "stores")
                query = query.Where(o => o.Seller == null || o.Seller.Type == "store" || o.Seller.Type == "stores" || o.Seller.Type == null);
            else
                query = query.Where(o => o.Seller != null && o.Seller.Type == type);
        }

        var offers = await query.OrderByDescending(o => o.CreatedAt).Take(10).ToListAsync();
        return Ok(offers.Select(FormatOffer));
    }

    [HttpGet("offers/flash-sale")]
    public async Task<IActionResult> GetFlashSaleOffers()
    {
        var offers = await _db.Offers
            .Include(o => o.Seller)
            .Include(o => o.OfferProducts).ThenInclude(op => op.Product)
            .Where(o => o.Status == "active" && (o.DiscountType == "flash-sale" || o.EndDate != null))
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(offers.Select(FormatOffer));
    }

    [HttpGet("offers/category/{categorySlug}")]
    public async Task<IActionResult> GetOffersByCategory(string categorySlug)
    {
        return await GetOffers(categorySlug, null);
    }

    [HttpGet("offers/{id}")]
    public async Task<IActionResult> GetOfferById(ulong id)
    {
        var offer = await _db.Offers
            .Include(o => o.Seller)
            .Include(o => o.OfferProducts).ThenInclude(op => op.Product).ThenInclude(p => p!.Seller)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (offer == null)
            return NotFound(new { message = "Offer not found" });

        return Ok(FormatOffer(offer));
    }

    private object FormatOffer(Offer o)
    {
        var img = ImageUrlHelper.Resolve(Request, _env, o.Banner ?? o.Thumbnail, "offers/banners");
        var thumb = ImageUrlHelper.Resolve(Request, _env, o.Thumbnail ?? o.Banner, "offers/thumbnails");
        return new
        {
            o.Id,
            o.SellerId,
            o.Title,
            o.Description,
            o.DiscountPercentage,
            discount_value = o.DiscountValue,
            o.OriginalPrice,
            o.DiscountPrice,
            o.Category,
            image = img,
            banner = img,
            thumbnail = thumb,
            o.ValidUntil,
            end_date = o.EndDate,
            o.Featured,
            o.LimitedTime,
            o.Active,
            o.CreatedAt,
            o.UpdatedAt,
            seller = o.Seller == null ? null : new
            {
                o.Seller.Id,
                o.Seller.Name,
                o.Seller.Type,
                logo = ImageUrlHelper.Resolve(Request, _env, o.Seller.Avatar ?? o.Seller.AvatarImage, "images/sellers")
            },
            products = o.OfferProducts.Where(op => op.Product != null).Select(op =>
            {
                var p = op.Product!;
                var pImg = ImageUrlHelper.Resolve(Request, _env, p.ImageUrl, "images/products", "https://placehold.co/400x400/fef3c7/b45309?text=Asalah");
                return new
                {
                    p.Id,
                    p.Name,
                    p.Description,
                    p.Price,
                    p.OldPrice,
                    p.Stock,
                    p.CategoryId,
                    p.SellerId,
                    image = pImg,
                    image_url = pImg,
                    p.Rating,
                    p.ReviewsCount,
                    p.Featured,
                    seller = p.Seller == null ? null : new { p.Seller.Id, p.Seller.Name, store_name = p.Seller.StoreName, p.Seller.Type }
                };
            }).ToList()
        };
    }

    // ==================== BANNERS & POLICIES ====================

    [HttpGet("banners")]
    public async Task<IActionResult> GetActiveBanners([FromQuery] string position = "home", [FromQuery] string type = "store")
    {
        var query = _db.Banners.Where(b => b.IsActive && b.Position == position);

        if (!string.IsNullOrEmpty(type) && type != "all")
        {
            if (type == "store" || type == "stores")
                query = query.Where(b => b.Type == "store" || b.Type == "stores" || b.Type == null || b.Type == "");
            else
                query = query.Where(b => b.Type == type);
        }

        var rawBanners = await query.OrderBy(b => b.SortOrder).ThenByDescending(b => b.CreatedAt).ToListAsync();
        var banners = rawBanners.Select(b =>
        {
            var resolved = ImageUrlHelper.Resolve(Request, _env, b.ImageUrl, "banners");
            return new
            {
                b.Id,
                b.Title,
                b.Description,
                image_url = resolved,
                full_image_url = resolved,
                b.LinkUrl,
                b.LinkText,
                b.IsActive,
                b.SortOrder,
                b.Position,
                b.Type,
                b.CreatedAt,
                b.UpdatedAt
            };
        });

        return Ok(new
        {
            success = true,
            data = banners,
            message = "Active banners retrieved successfully"
        });
    }

    [HttpGet("policies")]
    public async Task<IActionResult> GetPolicies()
    {
        var policies = await _db.Policies.Where(p => p.IsActive).ToListAsync();
        return Ok(new { data = policies });
    }

    [HttpGet("policies/{type}")]
    public async Task<IActionResult> GetPolicyByType(string type)
    {
        var policy = await _db.Policies.FirstOrDefaultAsync(p => p.IsActive && p.Type == type);
        if (policy == null)
            return NotFound(new { message = "Policy not found" });

        return Ok(new { data = policy });
    }

    // ==================== SHIPPING & PAYMENTS (PUBLIC / USER) ====================

    [HttpGet("shipping-companies/active")]
    public async Task<IActionResult> GetActiveShippingCompanies()
    {
        var companies = await _db.ShippingCompanies
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .ToListAsync();

        return Ok(companies);
    }

    [HttpGet("payment-methods/active")]
    public async Task<IActionResult> GetActivePaymentMethods()
    {
        var methods = await _db.PaymentMethods
            .Where(m => m.IsActive)
            .OrderBy(m => m.Name)
            .ToListAsync();

        return Ok(methods);
    }

    [Authorize]
    [HttpPost("user/payment-requests")]
    public async Task<IActionResult> CreateUserPaymentRequest(
        [FromForm] ulong order_id,
        [FromForm] string payment_method,
        [FromForm] string payment_method_name,
        [FromForm] string payer_name,
        [FromForm] string reference_number,
        [FromForm] string phone_number,
        [FromForm] string? payment_notes,
        [FromForm] decimal payment_amount,
        [FromForm] decimal payment_fee,
        IFormFile? payment_image)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        string? imagePath = null;
        if (payment_image != null && payment_image.Length > 0)
        {
            using var stream = payment_image.OpenReadStream();
            imagePath = await _fileStorage.SaveFileAsync(stream, payment_image.FileName, "payment_images");
        }

        var pr = new PaymentRequest
        {
            OrderId = order_id,
            UserId = userId.Value,
            PaymentMethod = payment_method,
            PaymentMethodName = payment_method_name,
            PayerName = payer_name,
            ReferenceNumber = reference_number,
            PhoneNumber = phone_number,
            PaymentNotes = payment_notes,
            PaymentImagePath = imagePath,
            PaymentAmount = payment_amount,
            PaymentFee = payment_fee,
            Status = "pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.PaymentRequests.Add(pr);
        await _db.SaveChangesAsync();

        return StatusCode(201, new
        {
            status = "success",
            message = "Payment request created successfully",
            data = pr
        });
    }

    // ==================== CONTACT US, ABOUT US & PUBLIC SETTINGS ====================

    [HttpPost("contact-us")]
    public async Task<IActionResult> SubmitContactUs([FromBody] SubmitContactRequest req)
    {
        var contact = new ContactUs
        {
            Name = req.Name,
            Email = req.Email,
            Phone = req.Phone,
            Subject = req.Subject,
            Message = req.Message,
            Status = "pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.ContactUsMessages.Add(contact);
        await _db.SaveChangesAsync();

        return StatusCode(201, contact);
    }

    [HttpGet("about-us")]
    public async Task<IActionResult> GetAboutUs()
    {
        var about = await _db.AboutUsPages.OrderBy(a => a.Id).FirstOrDefaultAsync();
        if (about != null && !string.IsNullOrEmpty(about.ImagePath))
        {
            about.ImagePath = ImageUrlHelper.Resolve(Request, _env, about.ImagePath, "images/about-us");
        }
        return Ok(about);
    }

    [HttpGet("settings")]
    public async Task<IActionResult> GetPublicSettings()
    {
        var settings = await _db.Settings.OrderBy(s => s.Id).FirstOrDefaultAsync();
        if (settings == null)
        {
            settings = new Setting { CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
            _db.Settings.Add(settings);
            await _db.SaveChangesAsync();
        }
        var logo = ImageUrlHelper.Resolve(Request, _env, settings.StoreLogo, "images/settings");
        var favicon = ImageUrlHelper.Resolve(Request, _env, settings.StoreFavicon, "images/settings");
        return Ok(new
        {
            settings.Id,
            settings.StoreName,
            settings.StoreDescription,
            store_logo = logo,
            store_favicon = favicon,
            settings.StoreEmail,
            settings.StorePhone,
            settings.StoreAddress,
            settings.SiteName,
            settings.SiteLanguage,
            settings.MaintenanceMode,
            settings.MaintenanceMessage,
            settings.AllowRegistration,
            settings.AllowGuestCheckout,
            settings.FacebookUrl,
            settings.InstagramUrl,
            settings.TwitterUrl,
            settings.WhatsappUrl,
            settings.TelegramUrl,
            settings.TiktokUrl,
            settings.YoutubeUrl
        });
    }

    // ==================== CUSTOMER MESSAGES ====================

    [Authorize]
    [HttpGet("messages")]
    public async Task<IActionResult> GetUserMessages()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var messages = await _db.Messages
            .Include(m => m.Seller)
            .Include(m => m.Product)
            .Include(m => m.Order)
            .Where(m => m.CustomerId == userId.Value)
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        return Ok(new { status = "success", data = messages });
    }

    [Authorize]
    [HttpPost("messages")]
    public async Task<IActionResult> SendCustomerMessage([FromBody] SendCustomerMessageRequest req)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var user = await _db.Users.FindAsync(userId.Value);
        if (user == null) return Unauthorized();

        var message = new Message
        {
            SellerId = req.SellerId,
            CustomerId = userId.Value,
            CustomerName = user.Name,
            CustomerEmail = user.Email,
            CustomerPhone = user.Phone,
            Subject = req.Subject ?? "رسالة جديدة",
            MessageText = req.Message,
            Type = req.Type ?? "general",
            Priority = req.Priority ?? "medium",
            Status = "unread",
            OrderId = req.OrderId,
            ProductId = req.ProductId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Messages.Add(message);
        await _db.SaveChangesAsync();

        return StatusCode(201, new { status = "success", message = "تم إرسال الرسالة بنجاح", data = message });
    }

    [Authorize]
    [HttpGet("messages/unread-count")]
    public async Task<IActionResult> GetUnreadMessageCount()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var count = await _db.Messages.CountAsync(m => m.CustomerId == userId.Value && m.Status == "replied" && !m.ReadAt.HasValue);
        return Ok(new { status = "success", unread_count = count });
    }

    [Authorize]
    [HttpGet("messages/{id}")]
    public async Task<IActionResult> GetMessageById(ulong id)
    {
        var userId = GetCurrentUserId();
        var msg = await _db.Messages
            .Include(m => m.Seller)
            .Include(m => m.Product)
            .Include(m => m.Order)
            .FirstOrDefaultAsync(m => m.Id == id && m.CustomerId == userId);

        if (msg == null) return NotFound(new { message = "Message not found" });
        return Ok(new { status = "success", data = msg });
    }

    [Authorize]
    [HttpPatch("messages/{id}/read")]
    public async Task<IActionResult> MarkMessageAsRead(ulong id)
    {
        var userId = GetCurrentUserId();
        var msg = await _db.Messages.FirstOrDefaultAsync(m => m.Id == id && m.CustomerId == userId);
        if (msg == null) return NotFound(new { message = "Message not found" });

        msg.ReadAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new { status = "success", data = msg });
    }

    [Authorize]
    [HttpDelete("messages/{id}")]
    public async Task<IActionResult> DeleteMessage(ulong id)
    {
        var userId = GetCurrentUserId();
        var msg = await _db.Messages.FirstOrDefaultAsync(m => m.Id == id && m.CustomerId == userId);
        if (msg == null) return NotFound(new { message = "Message not found" });

        _db.Messages.Remove(msg);
        await _db.SaveChangesAsync();
        return Ok(new { status = "success", message = "Deleted" });
    }

    // ==================== NOTIFICATIONS ====================

    [Authorize]
    [HttpGet("notifications")]
    public async Task<IActionResult> GetNotifications()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var isAdmin = User.IsInRole("admin");
        var query = _db.Notifications.Where(n => n.UserId == userId.Value || (isAdmin && n.UserId == null));

        var notifications = await query.OrderByDescending(n => n.Id).Take(50).ToListAsync();
        var unreadCount = await query.CountAsync(n => !n.Read);

        return Ok(new
        {
            status = "success",
            data = new
            {
                notifications,
                unread_count = unreadCount
            }
        });
    }

    [Authorize]
    [HttpPost("notifications/{id}/read")]
    public async Task<IActionResult> MarkNotificationRead(ulong id)
    {
        var notif = await _db.Notifications.FindAsync(id);
        if (notif != null)
        {
            notif.Read = true;
            notif.ReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
        }
        return Ok(new { status = "success" });
    }

    [Authorize]
    [HttpPost("notifications/read-all")]
    public async Task<IActionResult> MarkAllNotificationsRead()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var isAdmin = User.IsInRole("admin");
        var unread = await _db.Notifications
            .Where(n => !n.Read && (n.UserId == userId.Value || (isAdmin && n.UserId == null)))
            .ToListAsync();

        foreach (var n in unread)
        {
            n.Read = true;
            n.ReadAt = DateTime.UtcNow;
        }
        await _db.SaveChangesAsync();

        return Ok(new { status = "success" });
    }

    [Authorize]
    [HttpDelete("notifications/{id}")]
    public async Task<IActionResult> DeleteNotification(ulong id)
    {
        var notif = await _db.Notifications.FindAsync(id);
        if (notif != null)
        {
            _db.Notifications.Remove(notif);
            await _db.SaveChangesAsync();
        }
        return Ok(new { status = "success" });
    }
}
