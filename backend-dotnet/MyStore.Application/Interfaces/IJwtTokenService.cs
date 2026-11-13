using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using MyStore.Domain.Entities;

namespace MyStore.Application.Interfaces;

public interface IJwtTokenService
{
    string GenerateToken(User user);
}
