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

public class AdminDashboardController : AdminControllerBase
{
    public AdminDashboardController(IAppDbContext db, IDeliveryService deliveryService, IFileStorageService fileStorage, IWebHostEnvironment env) : base(db, deliveryService, fileStorage, env) { }

    // ==================== DASHBOARD ====================

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var totalUsers = await _db.Users.CountAsync();
        var totalSellers = await _db.Sellers.CountAsync();
        var totalDrivers = await _db.Users.CountAsync(u => u.Role == "driver");
        var totalProducts = await _db.Products.CountAsync();
        var totalCategories = await _db.Categories.CountAsync();
        var totalOrders = await _db.Orders.CountAsync();

        var orders = await _db.Orders
            .Include(o => o.User)
            .Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p!.Seller)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var activeOrders = orders.Where(o => o.Status != "cancelled").ToList();
        var totalRevenue = activeOrders.Sum(o => o.Total);
        var pendingOrders = orders.Count(o => o.Status == "pending");
        var processingOrders = orders.Count(o => o.Status == "processing" || o.Status == "shipped");
        var completedOrders = orders.Count(o => o.Status == "delivered");
        var cancelledOrders = orders.Count(o => o.Status == "cancelled");

        var now = DateTime.UtcNow;
        var todayStart = now.Date;
        var weekStart = todayStart.AddDays(-(int)todayStart.DayOfWeek);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var yearStart = new DateTime(now.Year, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        var todayList = activeOrders.Where(o => (o.CreatedAt ?? DateTime.MinValue) >= todayStart).ToList();
        var weekList = activeOrders.Where(o => (o.CreatedAt ?? DateTime.MinValue) >= weekStart).ToList();
        var monthList = activeOrders.Where(o => (o.CreatedAt ?? DateTime.MinValue) >= monthStart).ToList();
        var yearList = activeOrders.Where(o => (o.CreatedAt ?? DateTime.MinValue) >= yearStart).ToList();

        var recentOrders = orders.Take(10).ToList();
        var lowStockProducts = await _db.Products
            .Include(p => p.Seller)
            .Where(p => p.Stock <= 10)
            .OrderBy(p => p.Stock)
            .Take(10)
            .ToListAsync();

        var topSellingProducts = activeOrders
            .SelectMany(o => o.Items)
            .GroupBy(i => i.ProductId)
            .Select(g =>
            {
                var first = g.First();
                return new
                {
                    id = g.Key,
                    name = first.Product?.Name ?? first.ProductName ?? $"منتج #{g.Key}",
                    seller_name = first.Product?.Seller?.StoreName ?? first.Product?.Seller?.Name ?? "المتجر الرئيسي",
                    image = first.Product?.ImageUrl,
                    sales = g.Sum(x => x.Quantity),
                    revenue = g.Sum(x => x.Total > 0 ? x.Total : x.Price * x.Quantity)
                };
            })
            .OrderByDescending(x => x.sales)
            .Take(8)
            .ToList();

        var sellers = await _db.Sellers.AsNoTracking().ToListAsync();
        var sellersPerformance = sellers
            .Select(s =>
            {
                var sellerOrders = activeOrders
                    .Where(o => o.Items.Any(i => i.Product?.SellerId == s.Id))
                    .ToList();
                decimal SumForOrders(IEnumerable<Order> list) =>
                    list.SelectMany(o => o.Items)
                        .Where(i => i.Product?.SellerId == s.Id)
                        .Sum(i => i.Total > 0 ? i.Total : i.Price * i.Quantity);

                return new
                {
                    id = s.Id,
                    store_name = !string.IsNullOrWhiteSpace(s.StoreName) ? s.StoreName : s.Name,
                    type = s.Type,
                    total_orders = sellerOrders.Count,
                    completed_orders = sellerOrders.Count(o => o.Status == "delivered"),
                    today_sales = SumForOrders(sellerOrders.Where(o => (o.CreatedAt ?? DateTime.MinValue) >= todayStart)),
                    week_sales = SumForOrders(sellerOrders.Where(o => (o.CreatedAt ?? DateTime.MinValue) >= weekStart)),
                    month_sales = SumForOrders(sellerOrders.Where(o => (o.CreatedAt ?? DateTime.MinValue) >= monthStart)),
                    total_sales = SumForOrders(sellerOrders)
                };
            })
            .OrderByDescending(x => x.total_sales)
            .Take(10)
            .ToList();

        return Ok(new
        {
            total_users = totalUsers,
            total_sellers = totalSellers,
            total_drivers = totalDrivers,
            total_products = totalProducts,
            total_categories = totalCategories,
            total_orders = totalOrders,
            total_revenue = totalRevenue,
            pending_orders = pendingOrders,
            processing_orders = processingOrders,
            completed_orders = completedOrders,
            cancelled_orders = cancelledOrders,
            today_orders = todayList.Count,
            today_revenue = todayList.Sum(o => o.Total),
            this_week_orders = weekList.Count,
            this_week_revenue = weekList.Sum(o => o.Total),
            this_month_orders = monthList.Count,
            this_month_revenue = monthList.Sum(o => o.Total),
            this_year_orders = yearList.Count,
            this_year_revenue = yearList.Sum(o => o.Total),
            recent_orders = recentOrders,
            low_stock_products = lowStockProducts,
            top_selling_products = topSellingProducts,
            sellers_performance = sellersPerformance
        });
    }
}
