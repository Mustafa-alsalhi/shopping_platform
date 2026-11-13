using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Api.Features.CartAndOrders.Dtos;

public class CreateOrderRequest
{
    public JsonElement ShippingAddress { get; set; }
    public JsonElement? BillingAddress { get; set; }
    public string? PaymentMethod { get; set; }
    public decimal? Shipping { get; set; }
    public decimal? Tax { get; set; }
    public decimal? Discount { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? DeliveryNotes { get; set; }
    public string? Notes { get; set; }
    public List<CreateOrderItemInput>? Items { get; set; }
}
