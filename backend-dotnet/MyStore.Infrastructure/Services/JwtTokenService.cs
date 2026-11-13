using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;

namespace MyStore.Infrastructure.Services;

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var keyString = _configuration["Jwt:Key"] ?? "MyStoreMultiVendorPlatformSecretKey_2026_SecureTokenKey!@#";
        var issuer = _configuration["Jwt:Issuer"] ?? "MyStoreApi";
        var audience = _configuration["Jwt:Audience"] ?? "MyStoreClient";
        var expiryDays = int.TryParse(_configuration["Jwt:ExpiryDays"], out var d) ? d : 30;

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(keyString));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.Name, user.Name ?? string.Empty),
            new(ClaimTypes.Role, user.Role ?? "customer"),
            new("role", user.Role ?? "customer")
        };

        if (!string.IsNullOrEmpty(user.Phone))
        {
            claims.Add(new Claim("phone", user.Phone));
        }

        if (!string.IsNullOrEmpty(user.Email))
        {
            claims.Add(new Claim(ClaimTypes.Email, user.Email));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(expiryDays),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
