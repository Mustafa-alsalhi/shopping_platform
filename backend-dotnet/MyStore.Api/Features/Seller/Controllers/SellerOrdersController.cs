using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;
using MyStore.Api.Features.Seller.Dtos;

namespace MyStore.Api.Features.Seller.Controllers;

public class SellerOrdersController : SellerControllerBase
{
    public SellerOrdersController(IAppDbContext db, IFileStorageService fileStorage) : base(db, fileStorage) { }

    [HttpGet("taxes/active")]
        public async Task<IActionResult> GetActiveTaxes()
        {
            var taxes = await _db.Taxes.Where(t => t.IsActive).ToListAsync();
            return Ok(taxes);
        }
}
