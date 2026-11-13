using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;
using MyStore.Api.Features.Seller.Dtos;

namespace MyStore.Api.Features.Seller.Controllers;

public class SellerReportsController : SellerControllerBase
{
    public SellerReportsController(IAppDbContext db, IFileStorageService fileStorage) : base(db, fileStorage) { }

    [HttpGet("reports/comprehensive")]
        public async Task<IActionResult> GetComprehensiveReport()
        {
            var kpis = await GetReportKpis();
            var trends = await GetSalesTrends();
            var topProducts = await GetTopProducts();
            var lowStock = await GetLowStockProducts();
    
            return Ok(new
            {
                status = "success",
                data = new
                {
                    kpis = (kpis as OkObjectResult)?.Value,
                    sales_trends = (trends as OkObjectResult)?.Value,
                    top_products = (topProducts as OkObjectResult)?.Value,
                    low_stock = (lowStock as OkObjectResult)?.Value
                }
            });
        }
}
