using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Api.Features.CartAndOrders.Dtos;

public class CreateOrderItemInput
{
    public ulong ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public JsonElement? SelectedOptions { get; set; }
}
