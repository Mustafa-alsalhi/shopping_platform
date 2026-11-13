using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Api.Features.Seller.Dtos;

public class SellerSettingsFormRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? DeliveryTime { get; set; }
    public decimal? DeliveryFee { get; set; }
    public decimal? MinimumOrder { get; set; }
    public string? CuisineType { get; set; }
    public bool? IsOpen { get; set; }
    public bool? AcceptingOrders { get; set; }
    public string? WorkingHours { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? PaymentMethods { get; set; }
}
