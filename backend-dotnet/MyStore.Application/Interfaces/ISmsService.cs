using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using MyStore.Domain.Entities;

namespace MyStore.Application.Interfaces;

public interface ISmsService
{
    string? NormalizeYemeniPhone(string? phone);
    IReadOnlyList<string> GetPhoneVariants(string phone);
    Task<(bool Success, int StatusCode, string Message)> SendSmsAsync(string phone, string message, string? channel = null);
    Task<(bool Success, int StatusCode, string Message)> SendOtpAsync(string phone, string otp, string purpose = "register");
}
