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

public class PaymentMethodInput
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal Fee { get; set; }
    public bool? IsActive { get; set; }
    public JsonElement? Config { get; set; }
    public string? Icon { get; set; }
    public string? IconImage { get; set; }
}
