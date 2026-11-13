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

public class AdminOperationsController : AdminControllerBase
{
    public AdminOperationsController(IAppDbContext db, IDeliveryService deliveryService, IFileStorageService fileStorage, IWebHostEnvironment env) : base(db, deliveryService, fileStorage, env) { }

    // ==================== SHIPPING, PAYMENTS, TAXES ====================
    
        [HttpGet("shipping-companies")]
        public async Task<IActionResult> GetShippingCompanies()
        {
            var list = await _db.ShippingCompanies.OrderBy(s => s.Name).ToListAsync();
            return Ok(new { data = list, total = list.Count });
        }

    [HttpGet("shipping-companies/{id}")]
        public async Task<IActionResult> GetShippingCompany(ulong id)
        {
            var sc = await _db.ShippingCompanies.FindAsync(id);
            if (sc == null) return NotFound();
            return Ok(sc);
        }

    [HttpPost("shipping-companies")]
        public async Task<IActionResult> CreateShippingCompany([FromBody] ShippingCompany sc)
        {
            sc.CreatedAt = DateTime.UtcNow;
            sc.UpdatedAt = DateTime.UtcNow;
            _db.ShippingCompanies.Add(sc);
            await _db.SaveChangesAsync();
            return StatusCode(201, new { message = "Shipping company created successfully", company = sc });
        }

    [HttpPut("shipping-companies/{id}")]
        public async Task<IActionResult> UpdateShippingCompany(ulong id, [FromBody] ShippingCompany req)
        {
            var sc = await _db.ShippingCompanies.FindAsync(id);
            if (sc == null) return NotFound();
    
            sc.Name = req.Name;
            sc.Code = req.Code;
            sc.Description = req.Description;
            sc.Cost = req.Cost;
            sc.IsActive = req.IsActive;
            sc.DeliveryDays = req.DeliveryDays;
            sc.TrackingUrl = req.TrackingUrl;
            sc.UpdatedAt = DateTime.UtcNow;
    
            await _db.SaveChangesAsync();
            return Ok(new { message = "Shipping company updated successfully", company = sc });
        }

    [HttpDelete("shipping-companies/{id}")]
        public async Task<IActionResult> DeleteShippingCompany(ulong id)
        {
            var sc = await _db.ShippingCompanies.FindAsync(id);
            if (sc != null)
            {
                _db.ShippingCompanies.Remove(sc);
                await _db.SaveChangesAsync();
            }
            return Ok(new { message = "Shipping company deleted successfully" });
        }

    [HttpGet("payment-methods")]
        public async Task<IActionResult> GetPaymentMethods()
        {
            var list = await _db.PaymentMethods.OrderBy(m => m.Name).ToListAsync();
            return Ok(new { data = list, total = list.Count });
        }

    [HttpGet("payment-methods/{id}")]
        public async Task<IActionResult> GetPaymentMethod(ulong id)
        {
            var pm = await _db.PaymentMethods.FindAsync(id);
            if (pm == null) return NotFound();
            return Ok(pm);
        }

    [HttpPost("payment-methods")]
        public async Task<IActionResult> CreatePaymentMethod([FromBody] PaymentMethodInput req)
        {
            var pm = new PaymentMethod
            {
                Name = req.Name,
                Code = req.Code,
                Description = req.Description,
                Fee = req.Fee,
                IsActive = req.IsActive ?? true,
                Config = req.Config.HasValue ? JsonSerializer.Serialize(req.Config.Value) : null,
                Icon = req.Icon,
                IconImage = req.IconImage,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.PaymentMethods.Add(pm);
            await _db.SaveChangesAsync();
            return StatusCode(201, new { message = "Payment method created successfully", method = pm });
        }

    [HttpPut("payment-methods/{id}")]
        public async Task<IActionResult> UpdatePaymentMethod(ulong id, [FromBody] PaymentMethodInput req)
        {
            var pm = await _db.PaymentMethods.FindAsync(id);
            if (pm == null) return NotFound();
    
            pm.Name = req.Name;
            pm.Code = req.Code;
            pm.Description = req.Description;
            pm.Fee = req.Fee;
            if (req.IsActive.HasValue) pm.IsActive = req.IsActive.Value;
            if (req.Config.HasValue) pm.Config = JsonSerializer.Serialize(req.Config.Value);
            pm.Icon = req.Icon;
            pm.IconImage = req.IconImage;
            pm.UpdatedAt = DateTime.UtcNow;
    
            await _db.SaveChangesAsync();
            return Ok(new { message = "Payment method updated successfully", method = pm });
        }

    [HttpDelete("payment-methods/{id}")]
        public async Task<IActionResult> DeletePaymentMethod(ulong id)
        {
            var pm = await _db.PaymentMethods.FindAsync(id);
            if (pm != null)
            {
                _db.PaymentMethods.Remove(pm);
                await _db.SaveChangesAsync();
            }
            return Ok(new { message = "Payment method deleted successfully" });
        }

    [HttpPost("payment-methods/upload-icon")]
        public async Task<IActionResult> UploadPaymentMethodIcon(IFormFile icon)
        {
            if (icon == null || icon.Length == 0)
                return BadRequest(new { success = false, message = "No file uploaded" });
    
            using var stream = icon.OpenReadStream();
            var path = await _fileStorage.SaveFileAsync(stream, icon.FileName, "payment-methods");
            var iconUrl = $"{Request.Scheme}://{Request.Host}/storage/{path}";
            return Ok(new { success = true, icon_url = iconUrl, filename = Path.GetFileName(path) });
        }

    [HttpGet("payment-requests")]
        public async Task<IActionResult> GetPaymentRequests()
        {
            var list = await _db.PaymentRequests
                .Include(pr => pr.Order)
                .Include(pr => pr.User)
                .OrderByDescending(pr => pr.CreatedAt)
                .ToListAsync();
    
            return Ok(new { status = "success", data = list });
        }

    [HttpGet("payment-requests/statistics")]
        public async Task<IActionResult> GetPaymentRequestsStats()
        {
            var list = await _db.PaymentRequests.ToListAsync();
            return Ok(new
            {
                status = "success",
                data = new
                {
                    total = list.Count,
                    pending = list.Count(x => x.Status == "pending"),
                    approved = list.Count(x => x.Status == "approved"),
                    rejected = list.Count(x => x.Status == "rejected"),
                    total_amount = list.Sum(x => x.PaymentAmount)
                }
            });
        }

    [HttpGet("payment-requests/status/{status}")]
        public async Task<IActionResult> GetPaymentRequestsByStatus(string status)
        {
            var list = await _db.PaymentRequests
                .Include(pr => pr.Order)
                .Include(pr => pr.User)
                .Where(pr => pr.Status == status)
                .OrderByDescending(pr => pr.CreatedAt)
                .ToListAsync();
    
            return Ok(new { status = "success", data = list });
        }

    [HttpGet("payment-requests/{id}")]
        public async Task<IActionResult> GetPaymentRequest(ulong id)
        {
            var pr = await _db.PaymentRequests.Include(x => x.Order).Include(x => x.User).FirstOrDefaultAsync(x => x.Id == id);
            if (pr == null) return NotFound();
            return Ok(new { status = "success", data = pr });
        }

    [HttpPut("payment-requests/{id}")]
        public async Task<IActionResult> UpdatePaymentRequest(ulong id, [FromBody] UpdatePaymentRequestInput req)
        {
            var pr = await _db.PaymentRequests.FindAsync(id);
            if (pr == null) return NotFound();
    
            pr.Status = req.Status;
            pr.AdminNotes = req.AdminNotes;
            if (req.Status == "approved" && !pr.PaymentDate.HasValue)
                pr.PaymentDate = DateTime.UtcNow;
            pr.UpdatedAt = DateTime.UtcNow;
    
            await _db.SaveChangesAsync();
            return Ok(new { status = "success", message = "Payment request updated successfully", data = pr });
        }

    [HttpDelete("payment-requests/{id}")]
        public async Task<IActionResult> DeletePaymentRequest(ulong id)
        {
            var pr = await _db.PaymentRequests.FindAsync(id);
            if (pr != null)
            {
                _db.PaymentRequests.Remove(pr);
                await _db.SaveChangesAsync();
            }
            return Ok(new { status = "success", message = "Payment request deleted successfully" });
        }

    [HttpGet("taxes")]
        public async Task<IActionResult> GetTaxes()
        {
            return Ok(await _db.Taxes.ToListAsync());
        }

    [HttpGet("taxes/active")]
        public async Task<IActionResult> GetActiveTaxes()
        {
            return Ok(await _db.Taxes.Where(t => t.IsActive).ToListAsync());
        }

    [HttpGet("taxes/default")]
        public async Task<IActionResult> GetDefaultTax()
        {
            return Ok(await _db.Taxes.FirstOrDefaultAsync(t => t.IsActive && t.IsDefault));
        }

    [HttpGet("taxes/{id}")]
        public async Task<IActionResult> GetTax(ulong id)
        {
            var tax = await _db.Taxes.FindAsync(id);
            if (tax == null) return NotFound();
            return Ok(tax);
        }

    [HttpPost("taxes")]
        public async Task<IActionResult> CreateTax([FromBody] Tax req)
        {
            if (req.IsDefault)
            {
                var defaults = await _db.Taxes.Where(t => t.IsDefault).ToListAsync();
                foreach (var d in defaults) d.IsDefault = false;
            }
            req.CreatedAt = DateTime.UtcNow;
            req.UpdatedAt = DateTime.UtcNow;
            _db.Taxes.Add(req);
            await _db.SaveChangesAsync();
            return StatusCode(201, req);
        }

    [HttpPut("taxes/{id}")]
        public async Task<IActionResult> UpdateTax(ulong id, [FromBody] Tax req)
        {
            var tax = await _db.Taxes.FindAsync(id);
            if (tax == null) return NotFound();
    
            if (req.IsDefault && !tax.IsDefault)
            {
                var defaults = await _db.Taxes.Where(t => t.IsDefault).ToListAsync();
                foreach (var d in defaults) d.IsDefault = false;
            }
    
            tax.Name = req.Name;
            tax.Description = req.Description;
            tax.Rate = req.Rate;
            tax.Type = req.Type;
            tax.IsActive = req.IsActive;
            tax.IsDefault = req.IsDefault;
            tax.StartDate = req.StartDate;
            tax.EndDate = req.EndDate;
            tax.UpdatedAt = DateTime.UtcNow;
    
            await _db.SaveChangesAsync();
            return Ok(tax);
        }

    [HttpDelete("taxes/{id}")]
        public async Task<IActionResult> DeleteTax(ulong id)
        {
            var tax = await _db.Taxes.FindAsync(id);
            if (tax != null)
            {
                _db.Taxes.Remove(tax);
                await _db.SaveChangesAsync();
            }
            return Ok(new { message = "Tax deleted successfully" });
        }
}
