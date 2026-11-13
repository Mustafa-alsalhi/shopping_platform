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
            var totalOrders = await _db.Orders.CountAsync();
    
            var orders = await _db.Orders
                .Include(o => o.User)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();
    
            var totalRevenue = orders.Where(o => o.Status != "cancelled").Sum(o => o.Total);
            var pendingOrders = orders.Count(o => o.Status == "pending");
            var processingOrders = orders.Count(o => o.Status == "processing" || o.Status == "shipped");
            var completedOrders = orders.Count(o => o.Status == "delivered");
            var cancelledOrders = orders.Count(o => o.Status == "cancelled");
    
            var recentOrders = orders.Take(10).ToList();
            var lowStockProducts = await _db.Products
                .Include(p => p.Seller)
                .Where(p => p.Stock <= 10)
                .OrderBy(p => p.Stock)
                .Take(10)
                .ToListAsync();
    
            return Ok(new
            {
                total_users = totalUsers,
                total_sellers = totalSellers,
                total_drivers = totalDrivers,
                total_products = totalProducts,
                total_orders = totalOrders,
                total_revenue = totalRevenue,
                pending_orders = pendingOrders,
                processing_orders = processingOrders,
                completed_orders = completedOrders,
                cancelled_orders = cancelledOrders,
                recent_orders = recentOrders,
                low_stock_products = lowStockProducts
            });
        }
}
