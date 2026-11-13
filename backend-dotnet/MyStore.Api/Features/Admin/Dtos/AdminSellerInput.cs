using System.IO.Compression;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Api.Features.Admin.Dtos;

public class AdminSellerInput
{
    public ulong UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public string? Type { get; set; }
    public string? Status { get; set; }
    public bool? Verified { get; set; }
    public bool? Featured { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}
