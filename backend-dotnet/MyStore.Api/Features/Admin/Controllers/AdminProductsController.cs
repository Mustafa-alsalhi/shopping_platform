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

public class AdminProductsController : AdminControllerBase
{
    public AdminProductsController(IAppDbContext db, IDeliveryService deliveryService, IFileStorageService fileStorage, IWebHostEnvironment env) : base(db, deliveryService, fileStorage, env) { }

    // ==================== PRODUCTS CRUD ====================
    
        [HttpGet("products")]
        public async Task<IActionResult> GetProducts([FromQuery] string? search = null, [FromQuery] string? type = null)
        {
            var query = _db.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.ProductVariants).ThenInclude(v => v.Options)
                .AsQueryable();
    
            if (!string.IsNullOrEmpty(search))
                query = query.Where(p => p.Name.Contains(search) || (p.Sku != null && p.Sku.Contains(search)));
    
            if (!string.IsNullOrEmpty(type) && type != "all")
                query = query.Where(p => p.Seller != null && p.Seller.Type == type);
    
            var products = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
            return Ok(products);
        }

    [HttpPost("products")]
        public async Task<IActionResult> CreateProduct([FromForm] SellerProductFormRequest req, [FromForm] ulong? seller_id, List<IFormFile>? images, IFormFile? image)
        {
            var uploadedImages = new List<string>();
            if (images != null)
            {
                foreach (var f in images)
                {
                    if (f.Length > 0)
                    {
                        using var s = f.OpenReadStream();
                        uploadedImages.Add(await _fileStorage.SaveFileAsync(s, f.FileName, "products"));
                    }
                }
            }
            if (image != null && image.Length > 0)
            {
                using var s = image.OpenReadStream();
                uploadedImages.Insert(0, await _fileStorage.SaveFileAsync(s, image.FileName, "products"));
            }
    
            var product = new Product
            {
                SellerId = seller_id,
                CategoryId = req.CategoryId ?? 1,
                SellerCategoryId = req.SellerCategoryId,
                Name = req.Name ?? "منتج جديد",
                Description = req.Description ?? "",
                Price = req.Price,
                OldPrice = req.OldPrice,
                Stock = req.Stock,
                Brand = req.Brand,
                Sku = !string.IsNullOrEmpty(req.Sku) ? req.Sku : $"SKU-ADM-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}",
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
            await _db.SaveChangesAsync();
    
            if (!string.IsNullOrEmpty(req.Variants))
            {
                await SaveProductVariantsAsync(product.Id, req.Variants);
            }
    
            var created = await _db.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.ProductVariants).ThenInclude(v => v.Options)
                .FirstOrDefaultAsync(p => p.Id == product.Id);
    
            return StatusCode(201, created ?? product);
        }

    [HttpPut("products/{id}")]
        [HttpPost("products/{id}")]
        public async Task<IActionResult> UpdateProduct(ulong id, [FromForm] SellerProductFormRequest req, [FromForm] ulong? seller_id, List<IFormFile>? images, IFormFile? image)
        {
            var product = await _db.Products
                .Include(p => p.ProductVariants).ThenInclude(v => v.Options)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (product == null) return NotFound(new { message = "Product not found" });
    
            if (!string.IsNullOrEmpty(req.Name)) product.Name = req.Name;
            if (req.Description != null) product.Description = req.Description;
            if (req.Price > 0) product.Price = req.Price;
            product.OldPrice = req.OldPrice ?? product.OldPrice;
            product.Stock = req.Stock;
            if (req.CategoryId.HasValue) product.CategoryId = req.CategoryId.Value;
            if (seller_id.HasValue) product.SellerId = seller_id.Value;
            if (req.SellerCategoryId.HasValue) product.SellerCategoryId = req.SellerCategoryId.Value;
            if (req.Brand != null) product.Brand = req.Brand;
            if (!string.IsNullOrEmpty(req.Sku)) product.Sku = req.Sku;
            if (req.Weight.HasValue) product.Weight = req.Weight;
            if (req.Dimensions != null) product.Dimensions = req.Dimensions;
            if (req.Specifications != null) product.Specifications = req.Specifications;
            if (req.Status != null) product.Status = req.Status;
            if (req.Featured.HasValue) product.Featured = req.Featured.Value;
            if (req.PreparationTime.HasValue) product.PreparationTime = req.PreparationTime;
            if (req.Calories.HasValue) product.Calories = req.Calories;
            if (req.Addons != null) product.Addons = req.Addons;
            if (!string.IsNullOrEmpty(req.ImageUrl)) product.Image = req.ImageUrl;
    
            var uploadedImages = new List<string>();
            if (images != null)
            {
                foreach (var f in images)
                {
                    if (f.Length > 0)
                    {
                        using var s = f.OpenReadStream();
                        uploadedImages.Add(await _fileStorage.SaveFileAsync(s, f.FileName, "products"));
                    }
                }
            }
            if (image != null && image.Length > 0)
            {
                using var s = image.OpenReadStream();
                var mainPath = await _fileStorage.SaveFileAsync(s, image.FileName, "products");
                product.Image = mainPath;
                uploadedImages.Insert(0, mainPath);
            }
            if (uploadedImages.Count > 0)
            {
                product.Images = JsonSerializer.Serialize(uploadedImages);
            }
    
            product.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
    
            if (!string.IsNullOrEmpty(req.Variants))
            {
                _db.ProductVariants.RemoveRange(product.ProductVariants);
                await _db.SaveChangesAsync();
                await SaveProductVariantsAsync(product.Id, req.Variants);
            }
    
            var updated = await _db.Products
                .Include(p => p.Category)
                .Include(p => p.Seller)
                .Include(p => p.ProductVariants).ThenInclude(v => v.Options)
                .FirstOrDefaultAsync(p => p.Id == product.Id);
    
            return Ok(updated ?? product);
        }

    private async Task SaveProductVariantsAsync(ulong productId, string variantsJson)
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
                                PriceAdjustment = oDto.PriceAdjustment ?? 0,
                                Stock = oDto.Stock ?? 10,
                                ColorHex = oDto.ColorHex,
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

    [HttpDelete("products/{id}")]
        public async Task<IActionResult> DeleteProduct(ulong id)
        {
            var product = await _db.Products.FindAsync(id);
            if (product == null) return NotFound(new { message = "Product not found" });
    
            _db.Products.Remove(product);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Product deleted successfully" });
        }
}
