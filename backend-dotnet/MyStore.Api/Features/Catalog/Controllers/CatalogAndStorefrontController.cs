using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Api.Helpers;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;
using MyStore.Api.Features.Catalog.Dtos;

namespace MyStore.Api.Features.Catalog.Controllers;

[ApiController]
[Route("api")]
public class CatalogAndStorefrontController : ControllerBase
{
    private readonly IAppDbContext _db;
    private readonly IWebHostEnvironment _env;

    public CatalogAndStorefrontController(IAppDbContext db, IWebHostEnvironment env)
    {
        _db = db;
        _env = env;
    }

    private ulong? GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return ulong.TryParse(claim, out var id) ? id : null;
    }

    private object FormatProduct(Product p)
    {
        var imagesList = new List<string>();
        foreach (var rawJson in new[] { p.Images, p.GalleryImages })
        {
            if (string.IsNullOrWhiteSpace(rawJson)) continue;
            try
            {
                var parsed = JsonSerializer.Deserialize<List<string>>(rawJson);
                if (parsed != null)
                {
                    foreach (var img in parsed)
                    {
                        var resolved = ImageUrlHelper.Resolve(Request, _env, img, "images/products");
                        if (!string.IsNullOrEmpty(resolved) && !imagesList.Contains(resolved))
                            imagesList.Add(resolved);
                    }
                }
            }
            catch { }
        }

        var mainImg = ImageUrlHelper.Resolve(Request, _env, p.ImageUrl, "images/products");
        if (imagesList.Count == 0 && !string.IsNullOrEmpty(mainImg))
        {
            imagesList.Add(mainImg);
        }
        var finalImg = mainImg ?? imagesList.FirstOrDefault() ?? "https://placehold.co/400x400/fef3c7/b45309?text=Asalah";

        object? parsedFoodOptions = null;
        if (!string.IsNullOrWhiteSpace(p.FoodOptions))
        {
            try { parsedFoodOptions = JsonSerializer.Deserialize<JsonElement>(p.FoodOptions); }
            catch { }
        }

        object? formattedVariants = null;
        if (p.ProductVariants != null && p.ProductVariants.Count > 0)
        {
            formattedVariants = p.ProductVariants.OrderBy(v => v.Position).Select(v => new
            {
                v.Id,
                v.ProductId,
                v.Name,
                v.Type,
                v.Position,
                options = v.Options?.OrderBy(o => o.Position).Select(o => new
                {
                    o.Id,
                    o.VariantId,
                    o.Value,
                    o.PriceDelta,
                    o.Stock,
                    o.ColorCode,
                    o.Image,
                    o.Sku,
                    o.Position
                }).ToList()
            }).ToList();
        }
        else if (!string.IsNullOrWhiteSpace(p.VariantsJson))
        {
            try { formattedVariants = JsonSerializer.Deserialize<JsonElement>(p.VariantsJson); }
            catch { }
        }

        return new
        {
            p.Id,
            p.Name,
            p.Description,
            detailed_description = p.DetailedDescription,
            p.Price,
            sale_price = p.SalePrice,
            compare_at_price = p.CompareAtPrice,
            p.OldPrice,
            currency = p.Currency,
            p.Stock,
            p.CategoryId,
            p.SellerCategoryId,
            p.SellerId,
            image = finalImg,
            image_url = finalImg,
            images = imagesList,
            p.Brand,
            p.Sku,
            p.Weight,
            p.Dimensions,
            p.Specifications,
            p.Status,
            p.Rating,
            p.ReviewsCount,
            p.Featured,
            p.PreparationTime,
            p.Calories,
            p.Addons,
            food_options = parsedFoodOptions,
            p.CreatedAt,
            p.UpdatedAt,
            category = p.Category == null ? null : new
            {
                p.Category.Id,
                p.Category.Name,
                p.Category.Slug,
                p.Category.Type,
                image = ImageUrlHelper.Resolve(Request, _env, p.Category.Image ?? p.Category.ImageUrl, "images/categories")
            },
            seller_category = p.SellerCategory == null ? null : new { p.SellerCategory.Id, p.SellerCategory.Name, p.SellerCategory.Slug },
            seller = p.Seller == null ? null : FormatSellerSummary(p.Seller),
            variants = formattedVariants ?? new List<object>()
        };
    }

    private object FormatSellerSummary(Seller s)
    {
        var logoUrl = ImageUrlHelper.Resolve(Request, _env, s.Avatar ?? s.AvatarImage, "images/sellers");
        var coverUrl = ImageUrlHelper.Resolve(Request, _env, s.CoverImage, "images/sellers");
        return new
        {
            s.Id,
            s.UserId,
            s.Name,
            store_name = s.StoreName,
            s.Description,
            logo = logoUrl,
            avatar = logoUrl,
            avatar_image = logoUrl,
            cover_image = coverUrl,
            s.Rating,
            s.ReviewsCount,
            s.ProductsCount,
            s.Status,
            s.Type,
            s.DeliveryTime,
            s.PreparationTime,
            s.DeliveryFee,
            s.MinimumOrder,
            s.CuisineType,
            s.IsOpen,
            s.AcceptingOrders,
            s.IsVerified,
            s.Featured,
            s.Verified,
            s.City,
            s.Address,
            s.Latitude,
            s.Longitude,
            seller_categories = s.SellerCategories
        };
    }

    // ==================== PRODUCTS ====================

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts(
        [FromQuery] string? category = null,
        [FromQuery(Name = "seller_category")] ulong? sellerCategory = null,
        [FromQuery(Name = "seller_id")] ulong? sellerId = null,
        [FromQuery] string? search = null,
        [FromQuery(Name = "min_price")] decimal? minPrice = null,
        [FromQuery(Name = "max_price")] decimal? maxPrice = null,
        [FromQuery] string? brand = null,
        [FromQuery(Name = "in_stock")] bool? inStock = null,
        [FromQuery] bool? featured = null,
        [FromQuery(Name = "on_sale")] bool? onSale = null,
        [FromQuery] string? type = null,
        [FromQuery(Name = "sort_by")] string sortBy = "created_at",
        [FromQuery(Name = "sort_order")] string sortOrder = "desc",
        [FromQuery(Name = "per_page")] int perPage = 12,
        [FromQuery] int page = 1)
    {
        var query = _db.Products
            .Include(p => p.Category)
            .Include(p => p.SellerCategory)
            .Include(p => p.Seller)
            .Include(p => p.ProductVariants).ThenInclude(v => v.Options)
            .Where(p => p.IsActive);

        if (!string.IsNullOrEmpty(type) && type != "all")
        {
            if (type == "store" || type == "stores")
            {
                query = query.Where(p =>
                    (p.Seller != null && (p.Seller.Type == "store" || p.Seller.Type == "stores" || p.Seller.Type == null)) ||
                    (p.SellerId == null && (p.Category == null || p.Category.Type == "store" || p.Category.Type == "stores" || p.Category.Type == null)));
            }
            else if (type == "restaurant" || type == "restaurants")
            {
                query = query.Where(p =>
                    (p.Seller != null && (p.Seller.Type == "restaurant" || p.Seller.Type == "restaurants")) ||
                    (p.SellerId == null && p.Category != null && (p.Category.Type == "restaurant" || p.Category.Type == "restaurants")));
            }
            else
            {
                query = query.Where(p =>
                    (p.Seller != null && p.Seller.Type == type) ||
                    (p.SellerId == null && p.Category != null && p.Category.Type == type));
            }
        }
        else if (string.IsNullOrEmpty(type) && !sellerId.HasValue)
        {
            query = query.Where(p =>
                p.Seller == null || (p.Seller.Type != "restaurant" && p.Seller.Type != "restaurants"));
        }

        if (!string.IsNullOrEmpty(category))
        {
            if (ulong.TryParse(category, out var catId))
                query = query.Where(p => p.CategoryId == catId);
            else
                query = query.Where(p => p.Category != null && (p.Category.Slug == category || p.Category.Name == category));
        }

        if (sellerCategory.HasValue)
            query = query.Where(p => p.SellerCategoryId == sellerCategory.Value);

        if (sellerId.HasValue)
            query = query.Where(p => p.SellerId == sellerId.Value);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(p => p.Name.Contains(search) || (p.Description != null && p.Description.Contains(search)));

        if (minPrice.HasValue)
            query = query.Where(p => p.Price >= minPrice.Value);

        if (maxPrice.HasValue)
            query = query.Where(p => p.Price <= maxPrice.Value);

        if (!string.IsNullOrEmpty(brand))
            query = query.Where(p => p.Name.Contains(brand) || (p.Description != null && p.Description.Contains(brand)));

        if (inStock == true)
            query = query.Where(p => p.Stock > 0);

        if (featured == true)
            query = query.Where(p => p.IsFeatured);

        if (onSale == true)
            query = query.Where(p => (p.CompareAtPrice != null && p.CompareAtPrice > p.Price) || (p.SalePrice != null && p.SalePrice < p.Price));

        query = (sortBy.ToLower(), sortOrder.ToLower()) switch
        {
            ("price", "asc") => query.OrderBy(p => p.Price),
            ("price", _) => query.OrderByDescending(p => p.Price),
            ("rating", "asc") => query.OrderBy(p => p.Rating),
            ("rating", _) => query.OrderByDescending(p => p.Rating),
            ("name", "asc") => query.OrderBy(p => p.Name),
            ("name", _) => query.OrderByDescending(p => p.Name),
            (_, "asc") => query.OrderBy(p => p.CreatedAt),
            _ => query.OrderByDescending(p => p.CreatedAt)
        };

        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * perPage).Take(perPage).ToListAsync();
        var formatted = items.Select(FormatProduct).ToList();

        return Ok(new
        {
            current_page = page,
            data = formatted,
            per_page = perPage,
            total = total,
            last_page = (int)Math.Ceiling((double)total / Math.Max(1, perPage))
        });
    }

    [HttpGet("products/featured")]
    public async Task<IActionResult> GetFeaturedProducts([FromQuery] string? type = null)
    {
        var query = _db.Products
            .Include(p => p.Category)
            .Include(p => p.Seller)
            .Include(p => p.ProductVariants).ThenInclude(v => v.Options)
            .Where(p => p.IsActive && p.IsFeatured);

        if (!string.IsNullOrEmpty(type) && type != "all")
        {
            if (type == "store" || type == "stores")
                query = query.Where(p => p.Seller == null || p.Seller.Type == "store" || p.Seller.Type == "stores" || p.Seller.Type == null);
            else
                query = query.Where(p => p.Seller != null && p.Seller.Type == type);
        }
        else
        {
            query = query.Where(p => p.Seller == null || (p.Seller.Type != "restaurant" && p.Seller.Type != "restaurants"));
        }

        var items = await query.OrderByDescending(p => p.CreatedAt).Take(12).ToListAsync();
        return Ok(items.Select(FormatProduct));
    }

    [HttpGet("products/{id}")]
    public async Task<IActionResult> GetProductById(ulong id)
    {
        var product = await _db.Products
            .Include(p => p.Category)
            .Include(p => p.SellerCategory)
            .Include(p => p.Seller)
            .Include(p => p.ProductVariants).ThenInclude(v => v.Options)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (product == null)
            return NotFound(new { message = "Product not found" });

        return Ok(FormatProduct(product));
    }

    // ==================== CATEGORIES ====================

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories([FromQuery] string? type = null)
    {
        var query = _db.Categories.Where(c => c.IsActive);

        if (!string.IsNullOrEmpty(type) && type != "all")
        {
            if (type == "store" || type == "stores")
                query = query.Where(c => c.Type == "store" || c.Type == "stores" || c.Type == null || c.Type == "");
            else if (type == "restaurant" || type == "restaurants")
                query = query.Where(c => c.Type == "restaurant" || c.Type == "restaurants");
            else
                query = query.Where(c => c.Type == type);
        }
        else
        {
            query = query.Where(c => c.Type == "store" || c.Type == "stores" || c.Type == null || c.Type == "");
        }

        var rawCategories = await query
            .OrderBy(c => c.SortOrder)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Slug,
                c.Description,
                RawImage = c.Image ?? c.ImageUrl,
                Status = c.IsActive ? "active" : "inactive",
                Featured = c.ShowOnHomepage,
                c.Type,
                products_count = c.Products.Count(p => p.IsActive)
            })
            .ToListAsync();

        var categories = rawCategories.Select(c =>
        {
            var imgUrl = ImageUrlHelper.Resolve(Request, _env, c.RawImage, "images/categories");
            return new
            {
                c.Id,
                c.Name,
                c.Slug,
                c.Description,
                image = imgUrl,
                image_url = imgUrl,
                c.Status,
                c.Featured,
                c.Type,
                c.products_count
            };
        });

        return Ok(categories);
    }

    [HttpGet("restaurant-categories")]
    public async Task<IActionResult> GetRestaurantCategories()
    {
        var rawCategories = await _db.Categories
            .Where(c => c.IsActive && (c.Type == "restaurant" || c.Type == "restaurants"))
            .OrderBy(c => c.SortOrder)
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Slug,
                c.Description,
                RawImage = c.Image ?? c.ImageUrl,
                Status = c.IsActive ? "active" : "inactive",
                Featured = c.ShowOnHomepage,
                c.Type,
                products_count = c.Products.Count(p => p.IsActive)
            })
            .ToListAsync();

        var categories = rawCategories.Select(c =>
        {
            var imgUrl = ImageUrlHelper.Resolve(Request, _env, c.RawImage, "images/categories");
            return new
            {
                c.Id,
                c.Name,
                c.Slug,
                c.Description,
                image = imgUrl,
                image_url = imgUrl,
                c.Status,
                c.Featured,
                c.Type,
                c.products_count
            };
        });

        return Ok(categories);
    }

    [HttpGet("categories/{id}")]
    public async Task<IActionResult> GetCategoryById(string id)
    {
        Category? category;
        if (ulong.TryParse(id, out var catId))
            category = await _db.Categories.Include(c => c.Products).FirstOrDefaultAsync(c => c.Id == catId);
        else
            category = await _db.Categories.Include(c => c.Products).FirstOrDefaultAsync(c => c.Slug == id);

        if (category == null)
            return NotFound(new { message = "Category not found" });

        return Ok(category);
    }

    // ==================== SELLERS & RESTAURANTS ====================

    [HttpGet("sellers")]
    public async Task<IActionResult> GetSellers([FromQuery] string? type = null, [FromQuery] string? search = null)
    {
        var query = _db.Sellers.Where(s => s.Status == "active");

        if (!string.IsNullOrEmpty(type) && type != "all")
        {
            if (type == "store" || type == "stores")
                query = query.Where(s => s.Type == "store" || s.Type == "stores" || s.Type == null || s.Type == "");
            else if (type == "restaurant" || type == "restaurants")
                query = query.Where(s => s.Type == "restaurant" || s.Type == "restaurants");
            else
                query = query.Where(s => s.Type == type);
        }
        else
        {
            query = query.Where(s => s.Type == "store" || s.Type == "stores" || s.Type == null || s.Type == "");
        }

        if (!string.IsNullOrEmpty(search))
            query = query.Where(s => s.StoreName.Contains(search) || (s.Description != null && s.Description.Contains(search)));

        var sellers = await query
            .Include(s => s.SellerCategories.Where(sc => sc.IsActive))
            .OrderByDescending(s => s.IsVerified)
            .ThenByDescending(s => s.Rating)
            .ToListAsync();

        return Ok(sellers.Select(FormatSellerSummary));
    }

    [HttpGet("sellers/featured")]
    public async Task<IActionResult> GetFeaturedSellers([FromQuery] string? type = null)
    {
        var query = _db.Sellers.Where(s => s.Status == "active" && s.IsVerified);
        if (!string.IsNullOrEmpty(type) && type != "all")
        {
            if (type == "store" || type == "stores")
                query = query.Where(s => s.Type == "store" || s.Type == "stores" || s.Type == null);
            else
                query = query.Where(s => s.Type == type);
        }
        else
        {
            query = query.Where(s => s.Type == "store" || s.Type == "stores" || s.Type == null);
        }

        var sellers = await query.Take(10).ToListAsync();
        return Ok(sellers.Select(FormatSellerSummary));
    }

    [HttpGet("sellers/search")]
    public async Task<IActionResult> SearchSellers([FromQuery] string? q = null, [FromQuery] string? type = null)
    {
        return await GetSellers(type, q);
    }

    [HttpGet("sellers/category/{categorySlug}")]
    public async Task<IActionResult> GetSellersByCategory(string categorySlug)
    {
        var sellers = await _db.Sellers
            .Where(s => s.Status == "active" && s.Products.Any(p => p.Category != null && p.Category.Slug == categorySlug))
            .ToListAsync();
        return Ok(sellers.Select(FormatSellerSummary));
    }

    [HttpGet("sellers/{id}")]
    public async Task<IActionResult> GetSellerById(ulong id)
    {
        var seller = await _db.Sellers
            .Include(s => s.SellerCategories.Where(sc => sc.IsActive))
            .Include(s => s.Products.Where(p => p.IsActive))
                .ThenInclude(p => p.ProductVariants).ThenInclude(v => v.Options)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (seller == null)
            return NotFound(new { message = "Seller not found" });

        var logoUrl = ImageUrlHelper.Resolve(Request, _env, seller.Avatar ?? seller.AvatarImage, "images/sellers");
        var coverUrl = ImageUrlHelper.Resolve(Request, _env, seller.CoverImage, "images/sellers");

        return Ok(new
        {
            seller.Id,
            seller.UserId,
            seller.Name,
            store_name = seller.StoreName,
            seller.Description,
            logo = logoUrl,
            avatar = logoUrl,
            avatar_image = logoUrl,
            cover_image = coverUrl,
            seller.Rating,
            seller.ReviewsCount,
            seller.ProductsCount,
            seller.Status,
            seller.Type,
            seller.DeliveryTime,
            seller.PreparationTime,
            seller.DeliveryFee,
            seller.MinimumOrder,
            seller.CuisineType,
            seller.IsOpen,
            seller.AcceptingOrders,
            seller.WorkingHours,
            seller.City,
            seller.Latitude,
            seller.Longitude,
            seller.Featured,
            seller.Verified,
            seller.Email,
            seller.Phone,
            seller.Address,
            seller.PaymentMethods,
            seller_categories = seller.SellerCategories,
            products = seller.Products.Select(FormatProduct).ToList()
        });
    }

    [HttpGet("restaurants")]
    public async Task<IActionResult> GetRestaurants([FromQuery] string? search = null, [FromQuery] string? category = null)
    {
        var query = _db.Sellers
            .Include(s => s.SellerCategories.Where(sc => sc.IsActive))
            .Where(s => s.Status == "active" && (s.Type == "restaurant" || s.Type == "restaurants"));

        if (!string.IsNullOrEmpty(search))
            query = query.Where(s => s.StoreName.Contains(search) || (s.Description != null && s.Description.Contains(search)) || (s.CuisineType != null && s.CuisineType.Contains(search)));

        if (!string.IsNullOrEmpty(category) && category != "all")
        {
            query = query.Where(s =>
                (s.CuisineType != null && s.CuisineType.Contains(category)) ||
                s.Products.Any(p => p.Category != null && (p.Category.Slug == category || p.Category.Name == category)) ||
                s.SellerCategories.Any(sc => sc.Slug == category || sc.Name == category));
        }

        var restaurants = await query
            .OrderByDescending(s => s.IsOpen)
            .ThenByDescending(s => s.IsVerified)
            .ThenByDescending(s => s.Rating)
            .ToListAsync();

        return Ok(restaurants.Select(FormatSellerSummary));
    }

    [HttpGet("restaurants/featured")]
    public async Task<IActionResult> GetFeaturedRestaurants()
    {
        var restaurants = await _db.Sellers
            .Where(s => s.Status == "active" && (s.Type == "restaurant" || s.Type == "restaurants") && s.IsVerified)
            .OrderByDescending(s => s.IsOpen)
            .ThenByDescending(s => s.Rating)
            .Take(10)
            .ToListAsync();

        return Ok(restaurants.Select(FormatSellerSummary));
    }

    [HttpGet("restaurants/search")]
    public async Task<IActionResult> SearchRestaurants([FromQuery] string? q = null)
    {
        return await GetRestaurants(q, null);
    }

    [HttpGet("restaurants/category/{categorySlug}")]
    public async Task<IActionResult> GetRestaurantsByCategory(string categorySlug)
    {
        return await GetRestaurants(null, categorySlug);
    }

    [HttpGet("restaurants/{id}")]
    public async Task<IActionResult> GetRestaurantById(ulong id)
    {
        return await GetSellerById(id);
    }

    // ==================== ACTIVITIES ====================

    [HttpGet("activities")]
    public async Task<IActionResult> GetActiveActivities()
    {
        var activities = await _db.Activities
            .Where(a => a.IsActive)
            .OrderBy(a => a.SortOrder)
            .ToListAsync();

        return Ok(new { success = true, data = activities });
    }

    [HttpGet("activities/all")]
    public async Task<IActionResult> GetAllActivities()
    {
        var activities = await _db.Activities
            .OrderBy(a => a.SortOrder)
            .ToListAsync();

        return Ok(new { success = true, data = activities });
    }

    // ==================== REVIEWS ====================

    [HttpGet("products/{productId}/reviews")]
    public async Task<IActionResult> GetProductReviews(ulong productId)
    {
        var reviews = await _db.Reviews
            .Include(r => r.User)
            .Where(r => r.ProductId == productId && r.IsApproved)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                r.Id,
                r.UserId,
                r.ProductId,
                r.Rating,
                r.Comment,
                Status = r.IsApproved ? "approved" : "pending",
                r.CreatedAt,
                user = r.User == null ? null : new { r.User.Id, r.User.Name, Avatar = (string?)null }
            })
            .ToListAsync();

        return Ok(reviews);
    }

    [Authorize]
    [HttpPost("products/{productId}/reviews")]
    public async Task<IActionResult> CreateReview(ulong productId, [FromBody] CreateReviewRequest req)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var existing = await _db.Reviews.FirstOrDefaultAsync(r => r.ProductId == productId && r.UserId == userId.Value);
        if (existing != null)
            return BadRequest(new { message = "لقد قمت بتقييم هذا المنتج مسبقاً" });

        var review = new Review
        {
            ProductId = productId,
            UserId = userId.Value,
            Rating = Math.Clamp(req.Rating, 1, 5),
            Comment = req.Comment ?? string.Empty,
            Status = "approved",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Reviews.Add(review);
        await _db.SaveChangesAsync();

        await RecalculateProductRatingAsync(productId);

        var user = await _db.Users.FindAsync(userId.Value);
        return StatusCode(201, new
        {
            review.Id,
            review.UserId,
            review.ProductId,
            review.Rating,
            review.Comment,
            review.Status,
            review.CreatedAt,
            user = user == null ? null : new { user.Id, user.Name, user.Avatar }
        });
    }

    [Authorize]
    [HttpPut("reviews/{id}")]
    public async Task<IActionResult> UpdateReview(ulong id, [FromBody] CreateReviewRequest req)
    {
        var userId = GetCurrentUserId();
        var review = await _db.Reviews.FindAsync(id);
        if (review == null) return NotFound(new { message = "Review not found" });
        if (review.UserId != userId) return Forbid();

        review.Rating = Math.Clamp(req.Rating, 1, 5);
        review.Comment = req.Comment ?? review.Comment;
        review.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await RecalculateProductRatingAsync(review.ProductId);

        return Ok(review);
    }

    [Authorize]
    [HttpDelete("reviews/{id}")]
    public async Task<IActionResult> DeleteReview(ulong id)
    {
        var userId = GetCurrentUserId();
        var review = await _db.Reviews.FindAsync(id);
        if (review == null) return NotFound(new { message = "Review not found" });
        if (review.UserId != userId && !User.IsInRole("admin")) return Forbid();

        var productId = review.ProductId;
        _db.Reviews.Remove(review);
        await _db.SaveChangesAsync();
        await RecalculateProductRatingAsync(productId);

        return Ok(new { message = "Review deleted successfully" });
    }

    private async Task RecalculateProductRatingAsync(ulong productId)
    {
        var product = await _db.Products.FindAsync(productId);
        if (product == null) return;

        var reviews = await _db.Reviews.Where(r => r.ProductId == productId && r.IsApproved).ToListAsync();
        product.ReviewsCount = reviews.Count;
        product.Rating = reviews.Count > 0 ? Math.Round((decimal)reviews.Average(r => r.Rating), 2) : 0m;
        await _db.SaveChangesAsync();
    }

    // ==================== WISHLIST ====================

    [Authorize]
    [HttpGet("wishlist")]
    public async Task<IActionResult> GetWishlist()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var items = await _db.Wishlists
            .Include(w => w.Product).ThenInclude(p => p!.Category)
            .Include(w => w.Product).ThenInclude(p => p!.Seller)
            .Where(w => w.UserId == userId.Value && w.Product != null)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();

        var result = items.Select(w => new
        {
            w.Id,
            w.UserId,
            w.ProductId,
            w.CreatedAt,
            product = w.Product != null ? FormatProduct(w.Product) : null
        });

        return Ok(result);
    }

    [Authorize]
    [HttpPost("wishlist")]
    public async Task<IActionResult> AddToWishlist([FromBody] WishlistRequest req)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var existing = await _db.Wishlists.FirstOrDefaultAsync(w => w.UserId == userId.Value && w.ProductId == req.ProductId);
        if (existing != null)
            return Ok(new { message = "Already in wishlist", data = existing });

        var item = new Wishlist
        {
            UserId = userId.Value,
            ProductId = req.ProductId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Wishlists.Add(item);
        await _db.SaveChangesAsync();

        return StatusCode(201, new { message = "Added to wishlist", data = item });
    }

    [Authorize]
    [HttpDelete("wishlist/{productId}")]
    public async Task<IActionResult> RemoveFromWishlist(ulong productId)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var item = await _db.Wishlists.FirstOrDefaultAsync(w => w.UserId == userId.Value && w.ProductId == productId);
        if (item != null)
        {
            _db.Wishlists.Remove(item);
            await _db.SaveChangesAsync();
        }

        return Ok(new { message = "Removed from wishlist" });
    }

    [Authorize]
    [HttpGet("wishlist/check/{productId}")]
    public async Task<IActionResult> CheckWishlist(ulong productId)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var exists = await _db.Wishlists.AnyAsync(w => w.UserId == userId.Value && w.ProductId == productId);
        return Ok(new { in_wishlist = exists });
    }
}
