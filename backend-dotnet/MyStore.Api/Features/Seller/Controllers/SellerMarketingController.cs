using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;
using MyStore.Api.Features.Seller.Dtos;

namespace MyStore.Api.Features.Seller.Controllers;

public class SellerMarketingController : SellerControllerBase
{
    public SellerMarketingController(IAppDbContext db, IFileStorageService fileStorage) : base(db, fileStorage) { }

    [HttpGet("offers/{id}/products")]
        public async Task<IActionResult> GetSellerOfferProducts(ulong id)
        {
            var products = await _db.OfferProducts
                .Include(op => op.Product)
                .Where(op => op.OfferId == id && op.Product != null)
                .Select(op => op.Product)
                .ToListAsync();
    
            return Ok(products);
        }

    [HttpPost("offers/{id}/products")]
        public async Task<IActionResult> AddProductToSellerOffer(ulong id, [FromBody] OfferProductInput req)
        {
            var exists = await _db.OfferProducts.AnyAsync(op => op.OfferId == id && op.ProductId == req.ProductId);
            if (!exists)
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
            return Ok(new { message = "Product added to offer" });
        }

    [HttpDelete("offers/{id}/products/{productId}")]
        public async Task<IActionResult> RemoveProductFromSellerOffer(ulong id, ulong productId)
        {
            var op = await _db.OfferProducts.FirstOrDefaultAsync(x => x.OfferId == id && x.ProductId == productId);
            if (op != null)
            {
                _db.OfferProducts.Remove(op);
                await _db.SaveChangesAsync();
            }
            return Ok(new { message = "Product removed from offer" });
        }
}
