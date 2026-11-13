using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;
using MyStore.Api.Features.Seller.Dtos;

namespace MyStore.Api.Features.Seller.Controllers;

public class SellerCatalogController : SellerControllerBase
{
    public SellerCatalogController(IAppDbContext db, IFileStorageService fileStorage) : base(db, fileStorage) { }


}
