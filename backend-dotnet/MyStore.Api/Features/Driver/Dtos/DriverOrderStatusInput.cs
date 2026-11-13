using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Api.Features.Driver.Dtos;

public class DriverOrderStatusInput
{
    public string? DriverStatus { get; set; }
    public string? Status { get; set; }
    public string? DeliveryCode { get; set; }
}
