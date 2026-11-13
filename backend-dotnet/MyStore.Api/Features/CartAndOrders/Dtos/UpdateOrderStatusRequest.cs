using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Api.Features.CartAndOrders.Dtos;

public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
