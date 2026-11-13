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

public class AdminMarketingController : AdminControllerBase
{
    public AdminMarketingController(IAppDbContext db, IDeliveryService deliveryService, IFileStorageService fileStorage, IWebHostEnvironment env) : base(db, deliveryService, fileStorage, env) { }

    // ==================== BANNERS CRUD ====================
    
        [HttpGet("banners")]
        public async Task<IActionResult> GetBanners([FromQuery] string? position = null, [FromQuery] string? type = null)
        {
            var query = _db.Banners.AsQueryable();
            if (!string.IsNullOrEmpty(position)) query = query.Where(b => b.Position == position);
            if (!string.IsNullOrEmpty(type) && type != "all") query = query.Where(b => b.Type == type);
    
            var banners = await query.OrderBy(b => b.SortOrder).ThenByDescending(b => b.CreatedAt).ToListAsync();
            return Ok(new { success = true, data = banners });
        }

    [HttpGet("banners/{id}")]
        public async Task<IActionResult> GetBanner(ulong id)
        {
            var banner = await _db.Banners.FindAsync(id);
            if (banner == null) return NotFound(new { success = false, message = "Banner not found" });
            return Ok(new { success = true, data = banner });
        }

    [HttpPost("banners")]
        public async Task<IActionResult> CreateBanner([FromBody] BannerInput req)
        {
            var banner = new Banner
            {
                Title = req.Title,
                Description = req.Description,
                ImageUrl = req.ImageUrl,
                LinkUrl = req.LinkUrl,
                LinkText = req.LinkText,
                IsActive = req.IsActive ?? true,
                SortOrder = req.SortOrder ?? 0,
                Position = !string.IsNullOrEmpty(req.Position) ? req.Position : "home",
                Type = !string.IsNullOrEmpty(req.Type) ? req.Type : "store",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
    
            _db.Banners.Add(banner);
            await _db.SaveChangesAsync();
            return StatusCode(201, new { success = true, data = banner });
        }

    [HttpPut("banners/{id}")]
        public async Task<IActionResult> UpdateBanner(ulong id, [FromBody] BannerInput req)
        {
            var banner = await _db.Banners.FindAsync(id);
            if (banner == null) return NotFound(new { success = false, message = "Banner not found" });
    
            if (!string.IsNullOrEmpty(req.Title)) banner.Title = req.Title;
            if (req.Description != null) banner.Description = req.Description;
            if (!string.IsNullOrEmpty(req.ImageUrl)) banner.ImageUrl = req.ImageUrl;
            if (req.LinkUrl != null) banner.LinkUrl = req.LinkUrl;
            if (req.LinkText != null) banner.LinkText = req.LinkText;
            if (req.IsActive.HasValue) banner.IsActive = req.IsActive.Value;
            if (req.SortOrder.HasValue) banner.SortOrder = req.SortOrder.Value;
            if (!string.IsNullOrEmpty(req.Position)) banner.Position = req.Position;
            if (!string.IsNullOrEmpty(req.Type)) banner.Type = req.Type;
            banner.UpdatedAt = DateTime.UtcNow;
    
            await _db.SaveChangesAsync();
            return Ok(new { success = true, data = banner });
        }

    [HttpDelete("banners/{id}")]
        public async Task<IActionResult> DeleteBanner(ulong id)
        {
            var banner = await _db.Banners.FindAsync(id);
            if (banner == null) return NotFound(new { success = false, message = "Banner not found" });
    
            _db.Banners.Remove(banner);
            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Banner deleted successfully" });
        }

    [HttpPost("banners/upload-image")]
        public async Task<IActionResult> UploadBannerImage(IFormFile image)
        {
            if (image == null || image.Length == 0)
                return BadRequest(new { success = false, message = "No image file provided" });
    
            using var stream = image.OpenReadStream();
            var path = await _fileStorage.SaveFileAsync(stream, image.FileName, "banners");
            var imageUrl = $"/storage/{path}";
            var fullUrl = $"{Request.Scheme}://{Request.Host}{imageUrl}";
    
            return Ok(new
            {
                success = true,
                data = new { image_url = imageUrl, full_url = fullUrl },
                message = "Image uploaded successfully"
            });
        }

    // ==================== COUPONS & OFFERS CRUD ====================
    
        [HttpGet("coupons")]
        public async Task<IActionResult> GetCoupons()
        {
            var coupons = await _db.Coupons.Include(c => c.Seller).OrderByDescending(c => c.CreatedAt).ToListAsync();
            return Ok(new { status = "success", data = coupons });
        }

    [HttpGet("coupons/active")]
        public async Task<IActionResult> GetActiveCoupons()
        {
            var coupons = await _db.Coupons.Where(c => c.IsActive).ToListAsync();
            return Ok(new { status = "success", data = coupons });
        }

    [HttpGet("coupons/statistics")]
        public async Task<IActionResult> GetCouponStats()
        {
            var coupons = await _db.Coupons.ToListAsync();
            return Ok(new
            {
                status = "success",
                data = new
                {
                    total = coupons.Count,
                    active = coupons.Count(c => c.IsActive),
                    expired = coupons.Count(c => c.ExpiresAt.HasValue && c.ExpiresAt.Value < DateTime.UtcNow),
                    total_uses = coupons.Sum(c => c.UsedCount)
                }
            });
        }

    [HttpGet("coupons/{id}")]
        public async Task<IActionResult> GetCoupon(ulong id)
        {
            var coupon = await _db.Coupons.FindAsync(id);
            if (coupon == null) return NotFound(new { message = "Coupon not found" });
            return Ok(new { status = "success", data = coupon });
        }

    [HttpPost("coupons")]
        public async Task<IActionResult> CreateCoupon([FromBody] CouponInput req)
        {
            var coupon = new Coupon
            {
                Code = req.Code.Trim().ToUpperInvariant(),
                Name = req.Name,
                Description = req.Description,
                Type = req.Type ?? "percentage",
                Value = req.Value,
                MinOrderAmount = req.MinOrderAmount,
                MaxUses = req.MaxUses,
                StartsAt = req.StartsAt,
                ExpiresAt = req.ExpiresAt,
                IsActive = req.IsActive ?? true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
    
            _db.Coupons.Add(coupon);
            await _db.SaveChangesAsync();
            return StatusCode(201, new { status = "success", data = coupon });
        }

    [HttpPut("coupons/{id}")]
        public async Task<IActionResult> UpdateCoupon(ulong id, [FromBody] CouponInput req)
        {
            var coupon = await _db.Coupons.FindAsync(id);
            if (coupon == null) return NotFound(new { message = "Coupon not found" });
    
            if (!string.IsNullOrEmpty(req.Code)) coupon.Code = req.Code.Trim().ToUpperInvariant();
            if (!string.IsNullOrEmpty(req.Name)) coupon.Name = req.Name;
            coupon.Description = req.Description ?? coupon.Description;
            if (!string.IsNullOrEmpty(req.Type)) coupon.Type = req.Type;
            coupon.Value = req.Value;
            coupon.MinOrderAmount = req.MinOrderAmount;
            coupon.MaxUses = req.MaxUses;
            coupon.StartsAt = req.StartsAt;
            coupon.ExpiresAt = req.ExpiresAt;
            if (req.IsActive.HasValue) coupon.IsActive = req.IsActive.Value;
            coupon.UpdatedAt = DateTime.UtcNow;
    
            await _db.SaveChangesAsync();
            return Ok(new { status = "success", data = coupon });
        }

    [HttpPost("coupons/{id}/toggle-status")]
        public async Task<IActionResult> ToggleCouponStatus(ulong id)
        {
            var coupon = await _db.Coupons.FindAsync(id);
            if (coupon == null) return NotFound(new { message = "Coupon not found" });
    
            coupon.IsActive = !coupon.IsActive;
            coupon.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { status = "success", data = coupon });
        }

    [HttpDelete("coupons/{id}")]
        public async Task<IActionResult> DeleteCoupon(ulong id)
        {
            var coupon = await _db.Coupons.FindAsync(id);
            if (coupon == null) return NotFound(new { message = "Coupon not found" });
    
            _db.Coupons.Remove(coupon);
            await _db.SaveChangesAsync();
            return Ok(new { status = "success", message = "Coupon deleted" });
        }

    [HttpGet("offers")]
        public async Task<IActionResult> GetOffers()
        {
            var offers = await _db.Offers
                .Include(o => o.Seller)
                .Include(o => o.OfferProducts).ThenInclude(op => op.Product)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
            return Ok(offers);
        }

    [HttpGet("offers/{id}")]
        public async Task<IActionResult> GetOffer(ulong id)
        {
            var offer = await _db.Offers
                .Include(o => o.OfferProducts).ThenInclude(op => op.Product)
                .FirstOrDefaultAsync(o => o.Id == id);
            if (offer == null) return NotFound(new { message = "Offer not found" });
            return Ok(offer);
        }

    [HttpPost("offers")]
        public async Task<IActionResult> CreateOffer([FromForm] OfferFormRequest req, IFormFile? image)
        {
            string? imagePath = req.ImageUrl;
            if (image != null && image.Length > 0)
            {
                using var s = image.OpenReadStream();
                imagePath = await _fileStorage.SaveFileAsync(s, image.FileName, "offers");
            }
    
            var offer = new Offer
            {
                Title = req.Title ?? "عرض جديد",
                Description = req.Description ?? "",
                DiscountPercentage = req.DiscountPercentage,
                OriginalPrice = req.OriginalPrice,
                DiscountPrice = req.DiscountPrice,
                Category = req.Category ?? "special-deals",
                Image = imagePath,
                ValidUntil = req.ValidUntil ?? DateTime.UtcNow.AddDays(14),
                Featured = req.Featured ?? false,
                LimitedTime = req.LimitedTime ?? false,
                Active = req.Active ?? true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
    
            _db.Offers.Add(offer);
            await _db.SaveChangesAsync();
            return StatusCode(201, offer);
        }

    [HttpPut("offers/{id}")]
        [HttpPost("offers/{id}")]
        public async Task<IActionResult> UpdateOffer(ulong id, [FromForm] OfferFormRequest req, IFormFile? image)
        {
            var offer = await _db.Offers.FindAsync(id);
            if (offer == null) return NotFound(new { message = "Offer not found" });
    
            if (!string.IsNullOrEmpty(req.Title)) offer.Title = req.Title;
            if (req.Description != null) offer.Description = req.Description;
            if (req.DiscountPercentage > 0) offer.DiscountPercentage = req.DiscountPercentage;
            if (req.OriginalPrice.HasValue) offer.OriginalPrice = req.OriginalPrice;
            if (req.DiscountPrice.HasValue) offer.DiscountPrice = req.DiscountPrice;
            if (!string.IsNullOrEmpty(req.Category)) offer.Category = req.Category;
            if (req.ValidUntil.HasValue) offer.ValidUntil = req.ValidUntil.Value;
            if (req.Featured.HasValue) offer.Featured = req.Featured.Value;
            if (req.LimitedTime.HasValue) offer.LimitedTime = req.LimitedTime.Value;
            if (req.Active.HasValue) offer.Active = req.Active.Value;
    
            if (image != null && image.Length > 0)
            {
                using var s = image.OpenReadStream();
                offer.Image = await _fileStorage.SaveFileAsync(s, image.FileName, "offers");
            }
    
            offer.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(offer);
        }

    [HttpDelete("offers/{id}")]
        public async Task<IActionResult> DeleteOffer(ulong id)
        {
            var offer = await _db.Offers.FindAsync(id);
            if (offer == null) return NotFound(new { message = "Offer not found" });
    
            _db.Offers.Remove(offer);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Offer deleted" });
        }

    [HttpGet("offers/{id}/products")]
        public async Task<IActionResult> GetOfferProducts(ulong id)
        {
            var products = await _db.OfferProducts
                .Include(op => op.Product)
                .Where(op => op.OfferId == id && op.Product != null)
                .Select(op => op.Product)
                .ToListAsync();
            return Ok(products);
        }

    [HttpPost("offers/{id}/products")]
        public async Task<IActionResult> AddProductToOffer(ulong id, [FromBody] OfferProductInput req)
        {
            if (!await _db.OfferProducts.AnyAsync(op => op.OfferId == id && op.ProductId == req.ProductId))
            {
                _db.OfferProducts.Add(new OfferProduct
                {
                    OfferId = id,
                    ProductId = req.ProductId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                await _db.SaveChangesAsync();
            }
            return Ok(new { message = "Added" });
        }

    [HttpDelete("offers/{id}/products/{productId}")]
        public async Task<IActionResult> RemoveProductFromOffer(ulong id, ulong productId)
        {
            var op = await _db.OfferProducts.FirstOrDefaultAsync(x => x.OfferId == id && x.ProductId == productId);
            if (op != null)
            {
                _db.OfferProducts.Remove(op);
                await _db.SaveChangesAsync();
            }
            return Ok(new { message = "Removed" });
        }
}
