using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Api.Features.Seller.Dtos;

public class OfferFormRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int DiscountPercentage { get; set; }
    public decimal? OriginalPrice { get; set; }
    public decimal? DiscountPrice { get; set; }
    public string? Category { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime? ValidUntil { get; set; }
    public bool? Featured { get; set; }
    public bool? LimitedTime { get; set; }
    public bool? Active { get; set; }
}
