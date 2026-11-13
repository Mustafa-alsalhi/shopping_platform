using System.IO.Compression;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Api.Features.Admin.Dtos;

public class UpdatePaymentRequestInput
{
    public string Status { get; set; } = "pending";
    public string? AdminNotes { get; set; }
}
