using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Api.Features.Auth.Dtos;

public class LoginRequest
{
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string Password { get; set; } = string.Empty;
}
