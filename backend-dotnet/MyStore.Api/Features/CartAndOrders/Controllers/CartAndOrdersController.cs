using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;
using MyStore.Api.Features.CartAndOrders.Dtos;

namespace MyStore.Api.Features.CartAndOrders.Controllers;

[ApiController]
[Route("api")]
public class CartAndOrdersController : ControllerBase
{
    private readonly IAppDbContext _db;
    private readonly IDeliveryService _deliveryService;

    public CartAndOrdersController(IAppDbContext db, IDeliveryService deliveryService)
    {
        _db = db;
        _deliveryService = deliveryService;
    }

    private ulong? GetCurrentUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return ulong.TryParse(claim, out var id) ? id : null;
    }

    // ==================== CART ====================

    [Authorize]
    [HttpGet("cart")]
    public async Task<IActionResult> GetCart()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var cartItems = await _db.Carts
            .Include(c => c.Product).ThenInclude(p => p!.Seller)
            .Include(c => c.Product).ThenInclude(p => p!.Category)
            .Where(c => c.UserId == userId.Value)
            .ToListAsync();

        var total = cartItems.Sum(item => item.Quantity * (item.UnitPrice ?? item.Product?.Price ?? 0m));

        return Ok(new
        {
            items = cartItems.Select(c => new
            {
                c.Id,
                c.UserId,
                c.ProductId,
                c.Quantity,
                c.UnitPrice,
                selected_options = ParseJsonElement(c.SelectedOptions),
                product = c.Product == null ? null : new
                {
                    c.Product.Id,
                    c.Product.Name,
                    c.Product.Price,
                    c.Product.OldPrice,
                    c.Product.Stock,
                    c.Product.Image,
                    c.Product.SellerId,
                    seller = c.Product.Seller == null ? null : new
                    {
                        c.Product.Seller.Id,
                        c.Product.Seller.Name,
                        c.Product.Seller.Type,
                        c.Product.Seller.DeliveryFee,
                        c.Product.Seller.MinimumOrder,
                        c.Product.Seller.IsOpen,
                        c.Product.Seller.AcceptingOrders,
                        c.Product.Seller.Latitude,
                        c.Product.Seller.Longitude
                    }
                }
            }),
            total,
            count = cartItems.Sum(c => c.Quantity)
        });
    }

    [Authorize]
    [HttpPost("cart")]
    public async Task<IActionResult> AddToCart([FromBody] AddToCartRequest req)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var product = await _db.Products
            .Include(p => p.Seller)
            .Include(p => p.ProductVariants).ThenInclude(v => v.Options)
            .FirstOrDefaultAsync(p => p.Id == req.ProductId);

        if (product == null)
            return NotFound(new { message = "المنتج غير موجود" });

        // Check restaurant conflict
        var existingCartItems = await _db.Carts
            .Include(c => c.Product).ThenInclude(p => p!.Seller)
            .Where(c => c.UserId == userId.Value)
            .ToListAsync();

        if (existingCartItems.Count > 0)
        {
            var newIsRestaurant = product.Seller?.Type == "restaurant" || product.Seller?.Type == "restaurants";
            var existingRestaurantItem = existingCartItems.FirstOrDefault(c => c.Product?.Seller?.Type == "restaurant" || c.Product?.Seller?.Type == "restaurants");
            var existingStoreItem = existingCartItems.FirstOrDefault(c => c.Product?.Seller?.Type != "restaurant" && c.Product?.Seller?.Type != "restaurants");

            bool hasConflict = false;
            string conflictMessage = "";

            if (newIsRestaurant && existingRestaurantItem != null && existingRestaurantItem.Product?.SellerId != product.SellerId)
            {
                hasConflict = true;
                conflictMessage = "سلة التسوق تحتوي على وجبات من مطعم آخر. هل تريد إفراغ السلة وإضافة هذه الوجبة؟";
            }
            else if (newIsRestaurant && existingStoreItem != null)
            {
                hasConflict = true;
                conflictMessage = "سلة التسوق تحتوي على منتجات من المتاجر. لا يمكن دمج طلبات المطاعم مع المتاجر في سلة واحدة. هل تريد إفراغ السلة؟";
            }
            else if (!newIsRestaurant && existingRestaurantItem != null)
            {
                hasConflict = true;
                conflictMessage = "سلة التسوق تحتوي على وجبات من مطعم. لا يمكن دمج طلبات المتاجر مع المطاعم في سلة واحدة. هل تريد إفراغ السلة؟";
            }

            if (hasConflict)
            {
                if (req.ForceClear == true)
                {
                    _db.Carts.RemoveRange(existingCartItems);
                    await _db.SaveChangesAsync();
                    existingCartItems.Clear();
                }
                else
                {
                    return Conflict(new
                    {
                        conflict = true,
                        conflict_type = "different_restaurant",
                        message = conflictMessage
                    });
                }
            }
        }

        if (product.Stock < req.Quantity)
            return BadRequest(new { message = "الكمية المطلوبة غير متوفرة في المخزون" });

        decimal unitPrice = req.UnitPrice ?? product.Price;
        string? normalizedOptions = req.SelectedOptions.HasValue ? JsonSerializer.Serialize(req.SelectedOptions.Value) : null;

        var matchingItem = existingCartItems.FirstOrDefault(c =>
            c.ProductId == req.ProductId &&
            (c.SelectedOptions ?? "") == (normalizedOptions ?? ""));

        if (matchingItem != null)
        {
            matchingItem.Quantity += req.Quantity;
            matchingItem.UnitPrice = unitPrice;
            matchingItem.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(matchingItem);
        }

        var cartItem = new Cart
        {
            UserId = userId.Value,
            ProductId = req.ProductId,
            Quantity = req.Quantity,
            ProductName = product.Name,
            UnitPrice = unitPrice,
            ImageUrl = product.ImageUrl,
            Weight = product.Weight,
            Currency = product.Currency ?? "SAR",
            Status = "active",
            Featured = product.IsFeatured,
            SellerType = product.Seller?.Type ?? "store",
            SelectedOptions = normalizedOptions,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Carts.Add(cartItem);
        await _db.SaveChangesAsync();

        return StatusCode(201, cartItem);
    }

    [Authorize]
    [HttpPut("cart/{id}")]
    public async Task<IActionResult> UpdateCartItem(ulong id, [FromBody] UpdateCartRequest req)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var cartItem = await _db.Carts.Include(c => c.Product).FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId.Value);
        if (cartItem == null)
            return NotFound(new { message = "العنصر غير موجود في السلة" });

        if (cartItem.Product != null && cartItem.Product.Stock < req.Quantity)
            return BadRequest(new { message = "الكمية المطلوبة غير متوفرة في المخزون" });

        cartItem.Quantity = req.Quantity;
        cartItem.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(cartItem);
    }

    [Authorize]
    [HttpDelete("cart/{id}")]
    public async Task<IActionResult> RemoveFromCart(ulong id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var cartItem = await _db.Carts.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId.Value);
        if (cartItem != null)
        {
            _db.Carts.Remove(cartItem);
            await _db.SaveChangesAsync();
        }

        return Ok(new { message = "Item removed from cart" });
    }

    [Authorize]
    [HttpDelete("cart")]
    public async Task<IActionResult> ClearCart()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var items = await _db.Carts.Where(c => c.UserId == userId.Value).ToListAsync();
        _db.Carts.RemoveRange(items);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Cart cleared successfully" });
    }

    // ==================== CHECKOUT & DELIVERY CALCULATION ====================

    [Authorize]
    [HttpPost("checkout/calculate-delivery")]
    public async Task<IActionResult> CalculateDelivery([FromBody] CalculateDeliveryRequest req)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        double storeLat = 15.3694;
        double storeLng = 44.1910;

        var cartItem = await _db.Carts
            .Include(c => c.Product).ThenInclude(p => p!.Seller)
            .FirstOrDefaultAsync(c => c.UserId == userId.Value);

        if (cartItem?.Product?.Seller != null && cartItem.Product.Seller.Latitude.HasValue && cartItem.Product.Seller.Longitude.HasValue)
        {
            storeLat = (double)cartItem.Product.Seller.Latitude.Value;
            storeLng = (double)cartItem.Product.Seller.Longitude.Value;
        }

        var result = _deliveryService.CalculateFee(storeLat, storeLng, req.Latitude, req.Longitude);

        return Ok(new
        {
            status = "success",
            data = new
            {
                distance_km = result.DistanceKm,
                delivery_fee = result.DeliveryFee,
                currency = result.Currency,
                store_location = new { lat = storeLat, lng = storeLng }
            }
        });
    }

    // ==================== ORDERS ====================

    [Authorize]
    [HttpGet("orders")]
    public async Task<IActionResult> GetUserOrders()
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var orders = await _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p!.Seller)
            .Include(o => o.Driver)
            .Where(o => o.UserId == userId.Value)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders);
    }

    [Authorize]
    [HttpGet("orders/{id}")]
    public async Task<IActionResult> GetOrderById(ulong id)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var order = await _db.Orders
            .Include(o => o.User)
            .Include(o => o.Driver)
            .Include(o => o.Items).ThenInclude(i => i.Product).ThenInclude(p => p!.Seller)
            .FirstOrDefaultAsync(o => o.Id == id && (o.UserId == userId.Value || User.IsInRole("admin")));

        if (order == null)
            return NotFound(new { message = "Order not found" });

        return Ok(order);
    }

    [Authorize]
    [HttpPost("orders")]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest req)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();

        var cartItems = await _db.Carts
            .Include(c => c.Product).ThenInclude(p => p!.Seller)
            .Where(c => c.UserId == userId.Value)
            .ToListAsync();

        if (cartItems.Count == 0 && (req.Items == null || req.Items.Count == 0))
            return BadRequest(new { message = "السلة فارغة" });

        // Validate restaurant open status & stock
        foreach (var item in cartItems)
        {
            if (item.Product == null) continue;
            var seller = item.Product.Seller;
            if (seller != null && (seller.Type == "restaurant" || seller.Type == "restaurants"))
            {
                if (!seller.IsOpen || !seller.AcceptingOrders)
                    return BadRequest(new { message = $"عذراً، المطعم ({seller.Name}) مغلق حالياً أو لا يستقبل طلبات" });
            }

            if (item.Product.Stock < item.Quantity)
                return BadRequest(new { message = $"الكمية المطلوبة غير متوفرة للمنتج: {item.Product.Name}" });
        }

        decimal subtotal = 0m;
        if (cartItems.Count > 0)
        {
            subtotal = cartItems.Sum(c => c.Quantity * (c.UnitPrice ?? c.Product?.Price ?? 0m));
        }
        else if (req.Items != null)
        {
            subtotal = req.Items.Sum(i => i.Quantity * i.Price);
        }

        decimal shipping = req.Shipping ?? 0m;
        if (req.Latitude.HasValue && req.Longitude.HasValue)
        {
            double storeLat = 15.3694;
            double storeLng = 44.1910;
            var firstSeller = cartItems.FirstOrDefault()?.Product?.Seller;
            if (firstSeller?.Latitude != null && firstSeller.Longitude != null)
            {
                storeLat = (double)firstSeller.Latitude.Value;
                storeLng = (double)firstSeller.Longitude.Value;
            }
            var calc = _deliveryService.CalculateFee(storeLat, storeLng, (double)req.Latitude.Value, (double)req.Longitude.Value);
            shipping = calc.DeliveryFee;
        }

        decimal taxAmount = req.Tax ?? 0m;
        if (!req.Tax.HasValue)
        {
            var defaultTax = await _db.Taxes.FirstOrDefaultAsync(t => t.IsActive && t.IsDefault);
            if (defaultTax != null)
            {
                taxAmount = defaultTax.Type == "percentage"
                    ? Math.Round(subtotal * (defaultTax.Rate / 100m), 2)
                    : defaultTax.Rate;
            }
        }

        decimal discount = req.Discount ?? 0m;
        decimal total = Math.Max(0m, subtotal + shipping + taxAmount - discount);

        string orderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Random.Shared.Next(1000, 9999)}";
        string deliveryCode = Random.Shared.Next(100000, 999999).ToString();

        var order = new Order
        {
            OrderNumber = orderNumber,
            UserId = userId.Value,
            Subtotal = subtotal,
            Tax = taxAmount,
            Shipping = shipping,
            Total = total,
            Status = "pending",
            SellerStatus = "pending_approval",
            PaymentMethod = req.PaymentMethod ?? "cod",
            PaymentStatus = "pending",
            ShippingAddress = req.ShippingAddress.ValueKind != JsonValueKind.Undefined
                ? JsonSerializer.Serialize(req.ShippingAddress)
                : "{}",
            BillingAddress = req.BillingAddress.HasValue && req.BillingAddress.Value.ValueKind != JsonValueKind.Undefined
                ? JsonSerializer.Serialize(req.BillingAddress.Value)
                : null,
            Latitude = req.Latitude,
            Longitude = req.Longitude,
            DeliveryNotes = req.DeliveryNotes,
            Notes = req.Notes,
            DeliveryCode = deliveryCode,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();

        var notifiedSellers = new HashSet<ulong>();

        if (cartItems.Count > 0)
        {
            foreach (var c in cartItems)
            {
                var unitPrice = c.UnitPrice ?? c.Product?.Price ?? 0m;
                var orderItem = new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = c.ProductId,
                    SellerId = c.Product?.SellerId,
                    Quantity = c.Quantity,
                    Price = unitPrice,
                    Total = unitPrice * c.Quantity,
                    SelectedOptions = c.SelectedOptions,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.OrderItems.Add(orderItem);

                if (c.Product != null)
                {
                    c.Product.Stock = Math.Max(0, c.Product.Stock - c.Quantity);
                    if (c.Product.Seller?.UserId != null)
                    {
                        notifiedSellers.Add(c.Product.Seller.UserId.Value);
                    }
                }
            }

            _db.Carts.RemoveRange(cartItems);
        }
        else if (req.Items != null)
        {
            foreach (var item in req.Items)
            {
                var product = await _db.Products.Include(p => p.Seller).FirstOrDefaultAsync(p => p.Id == item.ProductId);
                var orderItem = new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = item.ProductId,
                    SellerId = product?.SellerId,
                    Quantity = item.Quantity,
                    Price = item.Price,
                    Total = item.Price * item.Quantity,
                    SelectedOptions = item.SelectedOptions.HasValue ? JsonSerializer.Serialize(item.SelectedOptions.Value) : null,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _db.OrderItems.Add(orderItem);

                if (product != null)
                {
                    product.Stock = Math.Max(0, product.Stock - item.Quantity);
                    if (product.Seller?.UserId != null)
                        notifiedSellers.Add(product.Seller.UserId.Value);
                }
            }
        }

        // Notify Admin
        _db.Notifications.Add(new Notification
        {
            UserId = null,
            Title = "طلب جديد",
            Message = $"تم استلام طلب جديد رقم {order.OrderNumber} بقيمة {order.Total}",
            Type = "order",
            Link = $"/admin/orders",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        });

        // Notify Sellers
        foreach (var sellerUserId in notifiedSellers)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = sellerUserId,
                Title = "طلب جديد لمتجرك",
                Message = $"لديك طلب جديد رقم {order.OrderNumber} بانتظار الموافقة والتجهيز",
                Type = "order",
                Link = "/seller/orders",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync();

        var createdOrder = await _db.Orders
            .Include(o => o.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == order.Id);

        return StatusCode(201, createdOrder);
    }

    [Authorize]
    [HttpPut("orders/{id}/status")]
    public async Task<IActionResult> UpdateOrderStatus(ulong id, [FromBody] UpdateOrderStatusRequest req)
    {
        var userId = GetCurrentUserId();
        var order = await _db.Orders.Include(o => o.Items).ThenInclude(i => i.Product).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound(new { message = "Order not found" });

        if (!User.IsInRole("admin") && order.UserId != userId)
            return Forbid();

        var oldStatus = order.Status;
        order.Status = req.Status;
        order.UpdatedAt = DateTime.UtcNow;

        if (req.Status == "cancelled" && oldStatus != "cancelled")
        {
            foreach (var item in order.Items)
            {
                if (item.Product != null)
                    item.Product.Stock += item.Quantity;
            }
        }

        await _db.SaveChangesAsync();
        return Ok(order);
    }

    private static object? ParseJsonElement(string? json)
    {
        if (string.IsNullOrEmpty(json)) return null;
        try { return JsonSerializer.Deserialize<JsonElement>(json); }
        catch { return json; }
    }
}
