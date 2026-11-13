using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Api.Features.Seller.Dtos;

public class UpdateSellerOrderStatusRequest
{
    public string? Status { get; set; }
    public string? SellerStatus { get; set; }
    public string? PreparationTime { get; set; }
}
