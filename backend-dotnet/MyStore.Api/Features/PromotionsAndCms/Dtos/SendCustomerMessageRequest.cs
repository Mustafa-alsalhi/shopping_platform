using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Api.Helpers;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Api.Features.PromotionsAndCms.Dtos;

public class SendCustomerMessageRequest
{
    public ulong SellerId { get; set; }
    public string? Subject { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Type { get; set; }
    public string? Priority { get; set; }
    public ulong? OrderId { get; set; }
    public ulong? ProductId { get; set; }
}
