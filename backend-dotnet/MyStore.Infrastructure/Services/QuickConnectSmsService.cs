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

public class QuickConnectSmsService : ISmsService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<QuickConnectSmsService> _logger;

    private static readonly char[] ArabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    private static readonly char[] EnglishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    public QuickConnectSmsService(HttpClient httpClient, IConfiguration configuration, ILogger<QuickConnectSmsService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public string? NormalizeYemeniPhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone))
            return null;

        var sb = new StringBuilder(phone.Trim());
        for (int i = 0; i < ArabicDigits.Length; i++)
        {
            sb.Replace(ArabicDigits[i], EnglishDigits[i]);
        }

        var digits = Regex.Replace(sb.ToString(), @"\D+", "");

        if (digits.StartsWith("00967"))
            digits = digits[5..];
        else if (digits.StartsWith("967") && digits.Length >= 12)
            digits = digits[3..];

        if (digits.Length == 10 && digits.StartsWith("0"))
            digits = digits[1..];

        if (Regex.IsMatch(digits, @"^7[01378]\d{7}$"))
            return digits;

        return null;
    }

    public IReadOnlyList<string> GetPhoneVariants(string phone)
    {
        var normalized = NormalizeYemeniPhone(phone) ?? Regex.Replace(phone ?? "", @"\D+", "");
        if (string.IsNullOrEmpty(normalized))
            return new[] { phone ?? "" };

        return new[]
        {
            normalized,
            "0" + normalized,
            "+967" + normalized,
            "967" + normalized,
            "00967" + normalized
        }.Distinct().ToList();
    }

    public async Task<(bool Success, int StatusCode, string Message)> SendSmsAsync(string phone, string message, string? channel = null)
    {
        var normalized = NormalizeYemeniPhone(phone);
        if (normalized == null)
        {
            return (false, 400, "رقم الجوال اليمني غير صحيح. يجب أن يبدأ بـ 77 أو 73 أو 71 أو 70 ويتكون من 9 أرقام.");
        }

        var baseUrl = (_configuration["QuickConnect:Url"] ?? "https://aalcgjgocszngpcqzjih.supabase.co/functions/v1/public-api").TrimEnd('/');
        var apiKey = _configuration["QuickConnect:ApiKey"] ?? "";
        var selectedChannel = !string.IsNullOrWhiteSpace(channel)
            ? channel
            : (_configuration["QuickConnect:Channel"] ?? "whatsapp");

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("QuickConnect:ApiKey is empty. Skipping external SMS send. Phone={Phone}, Message={Message}", normalized, message);
            return (true, 200, "تم إنشاء رمز التحقق (وضع التطوير المحلي)");
        }

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/messages");
            request.Headers.Add("Authorization", $"Bearer {apiKey}");
            request.Headers.Add("Accept", "application/json");
            request.Content = JsonContent.Create(new
            {
                channel = selectedChannel,
                to = normalized,
                body = message
            });

            var response = await _httpClient.SendAsync(request);
            var statusCode = (int)response.StatusCode;

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("SMS sent successfully via Quick Connect to {Phone}", normalized);
                return (true, statusCode, "تم الإرسال بنجاح");
            }

            var errorBody = await response.Content.ReadAsStringAsync();
            _logger.LogError("Quick Connect SMS API error ({Status}): {Body}", statusCode, errorBody);

            var errorMessage = statusCode switch
            {
                400 => "بيانات الرسالة أو رقم الجوال غير صحيح",
                401 => "مفتاح خدمة الرسائل النصية غير صالح",
                402 => "رصيد خدمة الرسائل النصية غير كافٍ حالياً",
                403 => "حساب خدمة الرسائل غير مفعّل أو المفتاح موقوف",
                404 => "مسار خدمة الرسائل غير موجود",
                _ => "فشل في إرسال الرسالة النصية عبر المزود"
            };

            return (false, statusCode, errorMessage);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception while sending SMS via Quick Connect to {Phone}", normalized);
            return (false, 500, "تعذر الاتصال بخدمة الرسائل النصية: " + ex.Message);
        }
    }

    public Task<(bool Success, int StatusCode, string Message)> SendOtpAsync(string phone, string otp, string purpose = "register")
    {
        var message = purpose switch
        {
            "register" => $"رمز التحقق لتفعيل حسابك هو: {otp}\nصالح لمدة 10 دقائق. لا تشارك هذا الرمز مع أي شخص.",
            "reset" => $"رمز استعادة كلمة المرور لحسابك هو: {otp}\nصالح لمدة 10 دقائق.",
            _ => $"رمز التحقق لتسجيل الدخول هو: {otp}\nصالح لمدة 10 دقائق."
        };

        return SendSmsAsync(phone, message);
    }
}
