using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Api.Features.Seller.Dtos;

public class VariantDto
{
    public string? Name { get; set; }
    public string? Type { get; set; }
    public List<VariantOptionDto>? Options { get; set; }
}
