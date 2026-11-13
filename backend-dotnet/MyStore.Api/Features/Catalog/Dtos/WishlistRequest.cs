using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Api.Helpers;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Api.Features.Catalog.Dtos;

public class WishlistRequest
{
    public ulong ProductId { get; set; }
}
