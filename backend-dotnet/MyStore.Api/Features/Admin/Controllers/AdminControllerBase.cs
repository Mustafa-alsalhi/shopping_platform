using System.IO.Compression;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;
using MyStore.Api.Features.Admin.Dtos;
using MyStore.Api.Features.Seller.Dtos;

namespace MyStore.Api.Features.Admin.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "admin")]
public abstract class AdminControllerBase : ControllerBase
{
    protected readonly IAppDbContext _db;
    protected readonly IDeliveryService _deliveryService;
    protected readonly IFileStorageService _fileStorage;
    protected readonly IWebHostEnvironment _env;

    protected AdminControllerBase(IAppDbContext db, IDeliveryService deliveryService, IFileStorageService fileStorage, IWebHostEnvironment env)
    {
        _db = db;
        _deliveryService = deliveryService;
        _fileStorage = fileStorage;
        _env = env;
    }
}
