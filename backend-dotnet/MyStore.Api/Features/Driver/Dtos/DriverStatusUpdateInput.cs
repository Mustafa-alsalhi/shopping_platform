using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Api.Features.Driver.Dtos;

public class DriverStatusUpdateInput
{
    public bool? IsOnline { get; set; }
    public string? Status { get; set; }
    public string? WorkZone { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
}
