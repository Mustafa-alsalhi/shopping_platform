using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Api.Features.Seller.Dtos;

public class VariantOptionDto
{
    public string? Value { get; set; }
    public decimal PriceDelta { get; set; }
    public int? Stock { get; set; }
    public string? ColorCode { get; set; }
    public string? Image { get; set; }
    public string? Sku { get; set; }
}
