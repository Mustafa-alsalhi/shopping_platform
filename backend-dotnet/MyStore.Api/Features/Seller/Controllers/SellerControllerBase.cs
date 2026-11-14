using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;
using MyStore.Api.Features.Seller.Dtos;

namespace MyStore.Api.Features.Seller.Controllers;

[ApiController]
[Route("api/seller")]
[Authorize(Roles = "seller,admin")]
public abstract class SellerControllerBase : ControllerBase
{
    protected readonly IAppDbContext _db;
    protected readonly IFileStorageService _fileStorage;

    protected SellerControllerBase(IAppDbContext db, IFileStorageService fileStorage)
    {
        _db = db;
        _fileStorage = fileStorage;
    }

    protected ulong? GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return ulong.TryParse(claim, out var id) ? id : null;
        }

    protected async Task<MyStore.Domain.Entities.Seller?> GetCurrentSellerAsync()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return null;
            return await _db.Sellers.FirstOrDefaultAsync(s => s.UserId == userId.Value);
        }

    // ==================== SELLER CATEGORIES ====================
    
        [HttpGet("categories")]
        public async Task<IActionResult> GetSellerCategories()
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var categories = await _db.SellerCategories
                .Where(sc => sc.SellerId == seller.Id)
                .OrderByDescending(sc => sc.CreatedAt)
                .ToListAsync();
    
            return Ok(categories);
        }

    [HttpPost("categories")]
        public async Task<IActionResult> CreateSellerCategory([FromBody] SellerCategoryInput req)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var slug = !string.IsNullOrEmpty(req.Slug)
                ? req.Slug
                : $"{req.Name.ToLowerInvariant().Replace(" ", "-")}-{Random.Shared.Next(100, 999)}";
    
            var cat = new SellerCategory
            {
                SellerId = seller.Id,
                Name = req.Name,
                Slug = slug,
                Description = req.Description,
                Image = req.Image,
                Status = req.Status ?? "active",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
    
            _db.SellerCategories.Add(cat);
            await _db.SaveChangesAsync();
    
            return StatusCode(201, cat);
        }

    [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateSellerCategory(ulong id, [FromBody] SellerCategoryInput req)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var cat = await _db.SellerCategories.FirstOrDefaultAsync(sc => sc.Id == id && sc.SellerId == seller.Id);
            if (cat == null) return NotFound(new { message = "Category not found" });
    
            cat.Name = req.Name ?? cat.Name;
            cat.Description = req.Description ?? cat.Description;
            cat.Status = req.Status ?? cat.Status;
            if (!string.IsNullOrEmpty(req.Image)) cat.Image = req.Image;
            cat.UpdatedAt = DateTime.UtcNow;
    
            await _db.SaveChangesAsync();
            return Ok(cat);
        }

    [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteSellerCategory(ulong id)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var cat = await _db.SellerCategories.FirstOrDefaultAsync(sc => sc.Id == id && sc.SellerId == seller.Id);
            if (cat == null) return NotFound(new { message = "Category not found" });
    
            _db.SellerCategories.Remove(cat);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Deleted successfully" });
        }

    // ==================== SELLER PRODUCTS ====================
    
        [HttpGet("products")]
        public async Task<IActionResult> GetSellerProducts([FromQuery] string? search = null, [FromQuery] string? status = null)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var query = _db.Products
                .Include(p => p.Category)
                .Include(p => p.SellerCategory)
                .Include(p => p.ProductVariants).ThenInclude(v => v.Options)
                .Where(p => p.SellerId == seller.Id);
    
            if (!string.IsNullOrEmpty(search))
                query = query.Where(p => p.Name.Contains(search) || (p.Sku != null && p.Sku.Contains(search)));
    
            if (!string.IsNullOrEmpty(status) && status != "all")
            {
                bool isActive = status == "active";
                query = query.Where(p => p.IsActive == isActive);
            }
    
            var products = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
            return Ok(products);
        }

    [HttpGet("products/{id}")]
        public async Task<IActionResult> GetSellerProduct(ulong id)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var product = await _db.Products
                .Include(p => p.Category)
                .Include(p => p.SellerCategory)
                .Include(p => p.ProductVariants).ThenInclude(v => v.Options)
                .FirstOrDefaultAsync(p => p.Id == id && p.SellerId == seller.Id);
    
            if (product == null) return NotFound(new { message = "Product not found" });
            return Ok(product);
        }

    [HttpPost("products")]
        public async Task<IActionResult> CreateSellerProduct([FromForm] SellerProductFormRequest req, List<IFormFile>? images, IFormFile? image)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var uploadedImages = new List<string>();
            if (images != null)
            {
                foreach (var file in images)
                {
                    if (file.Length > 0)
                    {
                        using var stream = file.OpenReadStream();
                        var path = await _fileStorage.SaveFileAsync(stream, file.FileName, "products");
                        uploadedImages.Add(path);
                    }
                }
            }
            if (image != null && image.Length > 0)
            {
                using var stream = image.OpenReadStream();
                var path = await _fileStorage.SaveFileAsync(stream, image.FileName, "products");
                uploadedImages.Insert(0, path);
            }
    
            ulong categoryId = req.CategoryId ?? 1;
            if (!req.CategoryId.HasValue)
            {
                var firstCat = await _db.Categories.FirstOrDefaultAsync();
                if (firstCat != null) categoryId = firstCat.Id;
            }
    
            var product = new Product
            {
                SellerId = seller.Id,
                CategoryId = categoryId,
                SellerCategoryId = req.SellerCategoryId,
                Name = req.Name ?? "منتج جديد",
                Description = req.Description ?? "",
                Price = req.Price,
                OldPrice = req.OldPrice,
                Stock = req.Stock,
                Brand = req.Brand,
                Sku = !string.IsNullOrEmpty(req.Sku) ? req.Sku : $"SKU-{seller.Id}-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}",
                Weight = req.Weight,
                Dimensions = req.Dimensions,
                Specifications = req.Specifications,
                Status = req.Status ?? "active",
                Featured = req.Featured ?? false,
                PreparationTime = req.PreparationTime,
                Calories = req.Calories,
                Addons = req.Addons,
                Image = uploadedImages.FirstOrDefault() ?? req.ImageUrl,
                Images = uploadedImages.Count > 0 ? JsonSerializer.Serialize(uploadedImages) : "[]",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
    
            _db.Products.Add(product);
            seller.ProductsCount += 1;
            await _db.SaveChangesAsync();
    
            if (!string.IsNullOrEmpty(req.Variants))
            {
                await SaveProductVariantsAsync(product.Id, req.Variants);
            }
    
            var created = await _db.Products
                .Include(p => p.ProductVariants).ThenInclude(v => v.Options)
                .FirstOrDefaultAsync(p => p.Id == product.Id);
    
            return StatusCode(201, created);
        }

    [HttpPut("products/{id}")]
        [HttpPost("products/{id}")]
        public async Task<IActionResult> UpdateSellerProduct(ulong id, [FromForm] SellerProductFormRequest req, List<IFormFile>? images, IFormFile? image)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var product = await _db.Products
                .Include(p => p.ProductVariants).ThenInclude(v => v.Options)
                .FirstOrDefaultAsync(p => p.Id == id && p.SellerId == seller.Id);
    
            if (product == null) return NotFound(new { message = "Product not found" });
    
            if (!string.IsNullOrEmpty(req.Name)) product.Name = req.Name;
            if (req.Description != null) product.Description = req.Description;
            if (req.Price > 0) product.Price = req.Price;
            product.OldPrice = req.OldPrice ?? product.OldPrice;
            product.Stock = req.Stock;
            if (req.CategoryId.HasValue) product.CategoryId = req.CategoryId.Value;
            product.SellerCategoryId = req.SellerCategoryId ?? product.SellerCategoryId;
            if (req.Brand != null) product.Brand = req.Brand;
            if (req.Status != null) product.Status = req.Status;
            if (req.Featured.HasValue) product.Featured = req.Featured.Value;
            if (req.PreparationTime.HasValue) product.PreparationTime = req.PreparationTime;
            if (req.Calories.HasValue) product.Calories = req.Calories;
            if (req.Addons != null) product.Addons = req.Addons;
    
            var uploadedImages = new List<string>();
            if (images != null)
            {
                foreach (var file in images)
                {
                    if (file.Length > 0)
                    {
                        using var stream = file.OpenReadStream();
                        var path = await _fileStorage.SaveFileAsync(stream, file.FileName, "products");
                        uploadedImages.Add(path);
                    }
                }
            }
            if (image != null && image.Length > 0)
            {
                using var stream = image.OpenReadStream();
                var path = await _fileStorage.SaveFileAsync(stream, image.FileName, "products");
                uploadedImages.Insert(0, path);
            }
    
            if (uploadedImages.Count > 0)
            {
                product.Image = uploadedImages.First();
                product.Images = JsonSerializer.Serialize(uploadedImages);
            }
    
            product.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
    
            if (!string.IsNullOrEmpty(req.Variants))
            {
                _db.ProductVariants.RemoveRange(product.Variants);
                await _db.SaveChangesAsync();
                await SaveProductVariantsAsync(product.Id, req.Variants);
            }
    
            var updated = await _db.Products
                .Include(p => p.ProductVariants).ThenInclude(v => v.Options)
                .FirstOrDefaultAsync(p => p.Id == product.Id);
    
            return Ok(updated);
        }

    [HttpDelete("products/{id}")]
        public async Task<IActionResult> DeleteSellerProduct(ulong id)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == id && p.SellerId == seller.Id);
            if (product == null) return NotFound(new { message = "Product not found" });
    
            _db.Products.Remove(product);
            seller.ProductsCount = Math.Max(0, seller.ProductsCount - 1);
            await _db.SaveChangesAsync();
    
            return Ok(new { message = "Product deleted successfully" });
        }

    protected async Task SaveProductVariantsAsync(ulong productId, string variantsJson)
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<List<VariantDto>>(variantsJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                if (parsed == null) return;
    
                int pos = 0;
                foreach (var vDto in parsed)
                {
                    var variant = new ProductVariant
                    {
                        ProductId = productId,
                        Name = vDto.Name ?? "خيار",
                        Type = vDto.Type ?? "select",
                        Position = pos++,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _db.ProductVariants.Add(variant);
                    await _db.SaveChangesAsync();
    
                    if (vDto.Options != null)
                    {
                        int optPos = 0;
                        foreach (var oDto in vDto.Options)
                        {
                            _db.VariantOptions.Add(new VariantOption
                            {
                                VariantId = variant.Id,
                                Value = oDto.Value ?? "",
                                PriceDelta = oDto.PriceDelta,
                                Stock = oDto.Stock,
                                ColorCode = oDto.ColorCode,
                                Image = oDto.Image,
                                Sku = oDto.Sku,
                                Position = optPos++,
                                CreatedAt = DateTime.UtcNow,
                                UpdatedAt = DateTime.UtcNow
                            });
                        }
                        await _db.SaveChangesAsync();
                    }
                }
            }
            catch { }
        }

    // ==================== SELLER ORDERS & STATISTICS ====================
    
        [HttpGet("orders")]
        public async Task<IActionResult> GetSellerOrders([FromQuery] string? status = null)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var query = _db.Orders
                .Include(o => o.User)
                .Include(o => o.Driver)
                .Include(o => o.Items.Where(i => i.Product != null && i.Product.SellerId == seller.Id))
                    .ThenInclude(i => i.Product)
                .Where(o => o.Items.Any(i => i.Product != null && i.Product.SellerId == seller.Id));
    
            if (!string.IsNullOrEmpty(status) && status != "all")
                query = query.Where(o => o.Status == status);
    
            var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
            return Ok(new { status = "success", data = orders });
        }

    [HttpGet("orders/{id}")]
        public async Task<IActionResult> GetSellerOrderById(ulong id)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var order = await _db.Orders
                .Include(o => o.User)
                .Include(o => o.Driver)
                .Include(o => o.Items).ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.Id == id && o.Items.Any(i => i.Product != null && i.Product.SellerId == seller.Id));
    
            if (order == null) return NotFound(new { message = "Order not found" });
            return Ok(new { status = "success", data = order });
        }

    [HttpPut("orders/{id}/status")]
        public async Task<IActionResult> UpdateSellerOrderStatus(ulong id, [FromBody] UpdateSellerOrderStatusRequest req)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var order = await _db.Orders
                .Include(o => o.Items).ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.Id == id && o.Items.Any(i => i.Product != null && i.Product.SellerId == seller.Id));
    
            if (order == null) return NotFound(new { message = "Order not found" });
    
            if (!string.IsNullOrEmpty(req.SellerStatus))
            {
                order.SellerStatus = req.SellerStatus;
                if (req.SellerStatus == "approved" || req.SellerStatus == "preparing")
                    order.Status = "processing";
                else if (req.SellerStatus == "rejected")
                    order.Status = "cancelled";
            }
    
            if (!string.IsNullOrEmpty(req.Status))
                order.Status = req.Status;
    
            if (!string.IsNullOrEmpty(req.PreparationTime))
                order.PreparationTime = req.PreparationTime;
    
            order.UpdatedAt = DateTime.UtcNow;
    
            _db.Notifications.Add(new Notification
            {
                UserId = order.UserId,
                Title = "تحديث حالة الطلب",
                Message = $"تم تحديث حالة طلبك رقم {order.OrderNumber} من قبل المتجر ({seller.Name})",
                Type = "order",
                Link = $"/orders/{order.Id}",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
    
            await _db.SaveChangesAsync();
            return Ok(new { status = "success", message = "Order status updated", data = order });
        }

    [HttpGet("statistics")]
        public async Task<IActionResult> GetSellerStatistics()
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var sellerOrders = await _db.Orders
                .Include(o => o.Items).ThenInclude(i => i.Product)
                .Where(o => o.Items.Any(i => i.Product != null && i.Product.SellerId == seller.Id))
                .ToListAsync();
    
            var totalOrders = sellerOrders.Count;
            var completedOrders = sellerOrders.Count(o => o.Status == "delivered");
            var pendingOrders = sellerOrders.Count(o => o.Status == "pending" || o.Status == "processing");
    
            var grossRevenue = sellerOrders
                .Where(o => o.Status != "cancelled")
                .SelectMany(o => o.Items.Where(i => i.Product != null && i.Product.SellerId == seller.Id))
                .Sum(i => i.Total);
    
            var netEarnings = Math.Round(grossRevenue * 0.90m, 2);
            var totalProducts = await _db.Products.CountAsync(p => p.SellerId == seller.Id);
    
            return Ok(new
            {
                status = "success",
                data = new
                {
                    total_orders = totalOrders,
                    completed_orders = completedOrders,
                    pending_orders = pendingOrders,
                    gross_revenue = grossRevenue,
                    net_earnings = netEarnings,
                    commission_rate = 10,
                    total_products = totalProducts,
                    rating = seller.Rating,
                    reviews_count = seller.ReviewsCount
                }
            });
        }

    [HttpGet("payment-requests")]
        public async Task<IActionResult> GetSellerPaymentRequests()
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var orderIds = await _db.OrderItems
                .Where(i => i.Product != null && i.Product.SellerId == seller.Id)
                .Select(i => i.OrderId)
                .Distinct()
                .ToListAsync();
    
            var requests = await _db.PaymentRequests
                .Include(pr => pr.Order)
                .Include(pr => pr.User)
                .Where(pr => pr.OrderId.HasValue && orderIds.Contains(pr.OrderId.Value))
                .OrderByDescending(pr => pr.CreatedAt)
                .ToListAsync();
    
            return Ok(new { status = "success", data = requests });
        }

    // ==================== SELLER SETTINGS ====================
    
        [HttpGet("settings")]
        public async Task<IActionResult> GetSellerSettings()
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            return Ok(new { status = "success", data = seller });
        }

    [HttpPut("settings")]
        [HttpPost("settings")]
        public async Task<IActionResult> UpdateSellerSettings([FromForm] SellerSettingsFormRequest req, IFormFile? logo, IFormFile? cover_image)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            if (!string.IsNullOrEmpty(req.Name)) seller.Name = req.Name;
            if (req.Description != null) seller.Description = req.Description;
            if (req.Email != null) seller.Email = req.Email;
            if (req.Phone != null) seller.Phone = req.Phone;
            if (req.Address != null) seller.Address = req.Address;
            if (req.DeliveryTime != null) seller.DeliveryTime = req.DeliveryTime;
            if (req.DeliveryFee.HasValue) seller.DeliveryFee = req.DeliveryFee.Value;
            if (req.MinimumOrder.HasValue) seller.MinimumOrder = req.MinimumOrder.Value;
            if (req.CuisineType != null) seller.CuisineType = req.CuisineType;
            if (req.IsOpen.HasValue) seller.IsOpen = req.IsOpen.Value;
            if (req.AcceptingOrders.HasValue) seller.AcceptingOrders = req.AcceptingOrders.Value;
            if (req.WorkingHours != null) seller.WorkingHours = req.WorkingHours;
            if (req.Latitude.HasValue) seller.Latitude = req.Latitude.Value;
            if (req.Longitude.HasValue) seller.Longitude = req.Longitude.Value;
            if (req.PaymentMethods != null) seller.PaymentMethods = req.PaymentMethods;
    
            if (logo != null && logo.Length > 0)
            {
                using var stream = logo.OpenReadStream();
                seller.Logo = await _fileStorage.SaveFileAsync(stream, logo.FileName, "sellers");
            }
    
            if (cover_image != null && cover_image.Length > 0)
            {
                using var stream = cover_image.OpenReadStream();
                seller.CoverImage = await _fileStorage.SaveFileAsync(stream, cover_image.FileName, "sellers");
            }
    
            seller.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
    
            return Ok(new { status = "success", message = "Settings updated successfully", data = seller });
        }

    // ==================== SELLER OFFERS ====================
    
        [HttpGet("offers")]
        public async Task<IActionResult> GetSellerOffers()
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var offers = await _db.Offers
                .Include(o => o.OfferProducts).ThenInclude(op => op.Product)
                .Where(o => o.SellerId == seller.Id)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
    
            return Ok(offers);
        }

    [HttpGet("offers/{id}")]
        public async Task<IActionResult> GetSellerOffer(ulong id)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var offer = await _db.Offers
                .Include(o => o.OfferProducts).ThenInclude(op => op.Product)
                .FirstOrDefaultAsync(o => o.Id == id && o.SellerId == seller.Id);
    
            if (offer == null) return NotFound(new { message = "Offer not found" });
            return Ok(offer);
        }

    [HttpPost("offers")]
        public async Task<IActionResult> CreateSellerOffer([FromForm] OfferFormRequest req, IFormFile? image)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            string? imagePath = req.ImageUrl;
            if (image != null && image.Length > 0)
            {
                using var stream = image.OpenReadStream();
                imagePath = await _fileStorage.SaveFileAsync(stream, image.FileName, "offers");
            }
    
            var offer = new Offer
            {
                SellerId = seller.Id,
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
        public async Task<IActionResult> UpdateSellerOffer(ulong id, [FromForm] OfferFormRequest req, IFormFile? image)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var offer = await _db.Offers.FirstOrDefaultAsync(o => o.Id == id && o.SellerId == seller.Id);
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
                using var stream = image.OpenReadStream();
                offer.Image = await _fileStorage.SaveFileAsync(stream, image.FileName, "offers");
            }
    
            offer.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
    
            return Ok(offer);
        }

    [HttpDelete("offers/{id}")]
        public async Task<IActionResult> DeleteSellerOffer(ulong id)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var offer = await _db.Offers.FirstOrDefaultAsync(o => o.Id == id && o.SellerId == seller.Id);
            if (offer == null) return NotFound(new { message = "Offer not found" });
    
            _db.Offers.Remove(offer);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Offer deleted" });
        }

    // ==================== SELLER COUPONS ====================
    
        [HttpGet("coupons")]
        public async Task<IActionResult> GetSellerCoupons()
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var coupons = await _db.Coupons
                .Where(c => c.SellerId == seller.Id)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();
    
            return Ok(new { status = "success", data = coupons });
        }

    [HttpGet("coupons/statistics")]
        public async Task<IActionResult> GetSellerCouponStatistics()
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var coupons = await _db.Coupons.Where(c => c.SellerId == seller.Id).ToListAsync();
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
        public async Task<IActionResult> GetSellerCoupon(ulong id)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var coupon = await _db.Coupons.FirstOrDefaultAsync(c => c.Id == id && c.SellerId == seller.Id);
            if (coupon == null) return NotFound(new { message = "Coupon not found" });
            return Ok(new { status = "success", data = coupon });
        }

    [HttpPost("coupons")]
        public async Task<IActionResult> CreateSellerCoupon([FromBody] CouponInput req)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var coupon = new Coupon
            {
                SellerId = seller.Id,
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
        public async Task<IActionResult> UpdateSellerCoupon(ulong id, [FromBody] CouponInput req)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var coupon = await _db.Coupons.FirstOrDefaultAsync(c => c.Id == id && c.SellerId == seller.Id);
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

    [HttpDelete("coupons/{id}")]
        public async Task<IActionResult> DeleteSellerCoupon(ulong id)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var coupon = await _db.Coupons.FirstOrDefaultAsync(c => c.Id == id && c.SellerId == seller.Id);
            if (coupon == null) return NotFound(new { message = "Coupon not found" });
    
            _db.Coupons.Remove(coupon);
            await _db.SaveChangesAsync();
            return Ok(new { status = "success", message = "Deleted" });
        }

    [HttpPost("coupons/{id}/toggle-status")]
        public async Task<IActionResult> ToggleSellerCouponStatus(ulong id)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var coupon = await _db.Coupons.FirstOrDefaultAsync(c => c.Id == id && c.SellerId == seller.Id);
            if (coupon == null) return NotFound(new { message = "Coupon not found" });
    
            coupon.IsActive = !coupon.IsActive;
            coupon.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
    
            return Ok(new { status = "success", data = coupon });
        }

    // ==================== SELLER MESSAGES & NOTIFICATIONS ====================
    
        [HttpGet("messages")]
        public async Task<IActionResult> GetSellerMessages([FromQuery] string? status = null)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var query = _db.Messages
                .Include(m => m.Customer)
                .Include(m => m.Order)
                .Include(m => m.Product)
                .Where(m => m.SellerId == seller.Id);
    
            if (!string.IsNullOrEmpty(status) && status != "all")
                query = query.Where(m => m.Status == status);
    
            var messages = await query.OrderByDescending(m => m.CreatedAt).ToListAsync();
            return Ok(new { status = "success", data = messages });
        }

    [HttpGet("messages/statistics")]
        public async Task<IActionResult> GetSellerMessageStatistics()
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var msgs = await _db.Messages.Where(m => m.SellerId == seller.Id).ToListAsync();
            return Ok(new
            {
                status = "success",
                data = new
                {
                    total = msgs.Count,
                    unread = msgs.Count(m => m.Status == "unread"),
                    replied = msgs.Count(m => m.Status == "replied"),
                    archived = msgs.Count(m => m.Status == "archived")
                }
            });
        }

    [HttpGet("messages/{id}")]
        public async Task<IActionResult> GetSellerMessage(ulong id)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var msg = await _db.Messages
                .Include(m => m.Customer)
                .Include(m => m.Order)
                .Include(m => m.Product)
                .FirstOrDefaultAsync(m => m.Id == id && m.SellerId == seller.Id);
    
            if (msg == null) return NotFound(new { message = "Message not found" });
            return Ok(new { status = "success", data = msg });
        }

    [HttpPut("messages/{id}")]
        public async Task<IActionResult> ReplySellerMessage(ulong id, [FromBody] SellerMessageReplyInput req)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var msg = await _db.Messages.FirstOrDefaultAsync(m => m.Id == id && m.SellerId == seller.Id);
            if (msg == null) return NotFound(new { message = "Message not found" });
    
            msg.Reply = req.Reply;
            msg.Status = "replied";
            msg.RepliedAt = DateTime.UtcNow;
            msg.ReadAt ??= DateTime.UtcNow;
            msg.UpdatedAt = DateTime.UtcNow;
    
            await _db.SaveChangesAsync();
            return Ok(new { status = "success", data = msg });
        }

    [HttpPatch("messages/{id}/read")]
        public async Task<IActionResult> MarkSellerMessageRead(ulong id)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var msg = await _db.Messages.FirstOrDefaultAsync(m => m.Id == id && m.SellerId == seller.Id);
            if (msg == null) return NotFound(new { message = "Message not found" });
    
            msg.Status = msg.Status == "unread" ? "read" : msg.Status;
            msg.ReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
    
            return Ok(new { status = "success", data = msg });
        }

    [HttpPatch("messages/{id}/archive")]
        public async Task<IActionResult> ArchiveSellerMessage(ulong id)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var msg = await _db.Messages.FirstOrDefaultAsync(m => m.Id == id && m.SellerId == seller.Id);
            if (msg == null) return NotFound(new { message = "Message not found" });
    
            msg.Status = "archived";
            await _db.SaveChangesAsync();
            return Ok(new { status = "success", data = msg });
        }

    [HttpDelete("messages/{id}")]
        public async Task<IActionResult> DeleteSellerMessage(ulong id)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var msg = await _db.Messages.FirstOrDefaultAsync(m => m.Id == id && m.SellerId == seller.Id);
            if (msg != null)
            {
                _db.Messages.Remove(msg);
                await _db.SaveChangesAsync();
            }
            return Ok(new { status = "success", message = "Deleted" });
        }

    [HttpGet("notifications")]
        public async Task<IActionResult> GetSellerNotifications()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized();
    
            var notifications = await _db.Notifications
                .Where(n => n.UserId == userId.Value)
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

    [HttpPut("notifications/read-all")]
        public async Task<IActionResult> MarkAllSellerNotificationsRead()
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized();
    
            var unread = await _db.Notifications.Where(n => n.UserId == userId.Value && !n.Read).ToListAsync();
            foreach (var n in unread)
            {
                n.Read = true;
                n.ReadAt = DateTime.UtcNow;
            }
            await _db.SaveChangesAsync();
            return Ok(new { status = "success" });
        }

    // ==================== SELLER REPORTS ====================
    
        [HttpGet("reports/kpis")]
        public async Task<IActionResult> GetReportKpis([FromQuery] string period = "month")
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var items = await _db.OrderItems
                .Include(i => i.Order)
                .Include(i => i.Product)
                .Where(i => i.Product != null && i.Product.SellerId == seller.Id && i.Order != null && i.Order.Status != "cancelled")
                .ToListAsync();
    
            var grossRevenue = items.Sum(i => i.Total);
            var netRevenue = Math.Round(grossRevenue * 0.90m, 2);
            var totalOrders = items.Select(i => i.OrderId).Distinct().Count();
            var totalUnits = items.Sum(i => i.Quantity);
    
            return Ok(new
            {
                status = "success",
                data = new
                {
                    gross_revenue = grossRevenue,
                    net_revenue = netRevenue,
                    commission_amount = grossRevenue - netRevenue,
                    total_orders = totalOrders,
                    total_units_sold = totalUnits,
                    average_order_value = totalOrders > 0 ? Math.Round(grossRevenue / totalOrders, 2) : 0m
                }
            });
        }

    [HttpGet("reports/sales-trends")]
        public async Task<IActionResult> GetSalesTrends([FromQuery] int days = 30)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var since = DateTime.UtcNow.AddDays(-days);
            var items = await _db.OrderItems
                .Include(i => i.Order)
                .Include(i => i.Product)
                .Where(i => i.Product != null && i.Product.SellerId == seller.Id && i.Order != null && i.Order.Status != "cancelled" && i.CreatedAt >= since)
                .ToListAsync();
    
            var trends = items
                .GroupBy(i => (i.CreatedAt ?? DateTime.UtcNow).Date)
                .OrderBy(g => g.Key)
                .Select(g => new
                {
                    date = g.Key.ToString("yyyy-MM-dd"),
                    gross_sales = g.Sum(x => x.Total),
                    net_sales = Math.Round(g.Sum(x => x.Total) * 0.90m, 2),
                    orders_count = g.Select(x => x.OrderId).Distinct().Count()
                })
                .ToList();
    
            return Ok(new { status = "success", data = trends });
        }

    [HttpGet("reports/top-products")]
        public async Task<IActionResult> GetTopProducts([FromQuery] int limit = 10)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var top = await _db.OrderItems
                .Include(i => i.Product)
                .Where(i => i.Product != null && i.Product.SellerId == seller.Id)
                .GroupBy(i => new { i.ProductId, i.Product!.Name, i.Product.Price, i.Product.ImageUrl })
                .Select(g => new
                {
                    product_id = g.Key.ProductId,
                    name = g.Key.Name,
                    price = g.Key.Price,
                    image = g.Key.ImageUrl,
                    total_sold = g.Sum(x => x.Quantity),
                    total_revenue = g.Sum(x => x.Total)
                })
                .OrderByDescending(x => x.total_sold)
                .Take(limit)
                .ToListAsync();
    
            return Ok(new { status = "success", data = top });
        }

    [HttpGet("reports/low-stock")]
        public async Task<IActionResult> GetLowStockProducts([FromQuery] int threshold = 10)
        {
            var seller = await GetCurrentSellerAsync();
            if (seller == null) return NotFound(new { message = "Seller profile not found" });
    
            var products = await _db.Products
                .Where(p => p.SellerId == seller.Id && p.Stock <= threshold)
                .OrderBy(p => p.Stock)
                .ToListAsync();
    
            return Ok(new { status = "success", data = products });
        }
}
