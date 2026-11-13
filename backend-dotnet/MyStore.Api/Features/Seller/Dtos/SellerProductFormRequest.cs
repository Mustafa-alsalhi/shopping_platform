using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Api.Features.Seller.Dtos;

public class SellerProductFormRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public decimal? OldPrice { get; set; }
    public int Stock { get; set; }
    public ulong? CategoryId { get; set; }
    public ulong? SellerCategoryId { get; set; }
    public string? Brand { get; set; }
    public string? Sku { get; set; }
    public decimal? Weight { get; set; }
    public string? Dimensions { get; set; }
    public string? Specifications { get; set; }
    public string? Status { get; set; }
    public bool? Featured { get; set; }
    public int? PreparationTime { get; set; }
    public int? Calories { get; set; }
    public string? Addons { get; set; }
    public string? ImageUrl { get; set; }
    public string? Variants { get; set; }
}
