using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;
using MyStore.Api.Features.Seller.Dtos;

namespace MyStore.Api.Features.Seller.Controllers;

public class SellerCommunicationController : SellerControllerBase
{
    public SellerCommunicationController(IAppDbContext db, IFileStorageService fileStorage) : base(db, fileStorage) { }

    [HttpPut("notifications/{id}/read")]
        public async Task<IActionResult> MarkSellerNotificationRead(ulong id)
        {
            var notif = await _db.Notifications.FindAsync(id);
            if (notif != null)
            {
                notif.Read = true;
                notif.ReadAt = DateTime.UtcNow;
                await _db.SaveChangesAsync();
            }
            return Ok(new { status = "success" });
        }
}
