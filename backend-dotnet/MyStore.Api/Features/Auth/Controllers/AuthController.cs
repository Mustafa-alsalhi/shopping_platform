using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using MyStore.Application.Interfaces;
using MyStore.Domain.Entities;
using MyStore.Api.Features.Auth.Dtos;

namespace MyStore.Api.Features.Auth.Controllers;

[ApiController]
[Route("api")]
public class AuthController : ControllerBase
{
    private readonly IAppDbContext _db;
    private readonly IJwtTokenService _jwtService;
    private readonly ISmsService _smsService;
    private readonly IFileStorageService _fileStorage;
    private readonly IMemoryCache _cache;
    private readonly IConfiguration _config;

    public AuthController(
        IAppDbContext db,
        IJwtTokenService jwtService,
        ISmsService smsService,
        IFileStorageService fileStorage,
        IMemoryCache cache,
        IConfiguration config)
    {
        _db = db;
        _jwtService = jwtService;
        _smsService = smsService;
        _fileStorage = fileStorage;
        _cache = cache;
        _config = config;
    }

    private async Task<User?> FindUserByPhoneAsync(string phone)
    {
        var variants = _smsService.GetPhoneVariants(phone);
        return await _db.Users
            .Include(u => u.Seller)
            .Include(u => u.Driver)
            .FirstOrDefaultAsync(u => u.Phone != null && variants.Contains(u.Phone));
    }

    private static object FormatUserPayload(User user)
    {
        var cleanEmail = !string.IsNullOrEmpty(user.Email) && user.Email.EndsWith("@phone.local")
            ? null
            : user.Email;

        return new
        {
            id = user.Id,
            first_name = user.FirstName,
            last_name = user.LastName,
            name = user.Name,
            email = cleanEmail,
            phone = user.Phone,
            address = user.Address,
            city = user.City,
            state = user.State,
            country = user.Country,
            postal_code = user.PostalCode,
            role = user.Role,
            is_active = user.IsActive,
            seller_status = user.Seller?.Status
        };
    }

    private static string GenerateSixDigitOtp()
    {
        return RandomNumberGenerator.GetInt32(0, 1000000).ToString("D6");
    }

    private static bool VerifyPassword(string password, string storedHash)
    {
        if (string.IsNullOrEmpty(storedHash))
            return false;

        try
        {
            return BCrypt.Net.BCrypt.Verify(password, storedHash);
        }
        catch
        {
            return false;
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FirstName) && !string.IsNullOrWhiteSpace(request.Name))
        {
            var parts = request.Name.Trim().Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
            request.FirstName = parts.Length > 0 ? parts[0] : request.Name.Trim();
            request.LastName = parts.Length > 1 ? parts[1] : request.FirstName;
        }

        if (string.IsNullOrWhiteSpace(request.FirstName) || string.IsNullOrWhiteSpace(request.LastName) ||
            string.IsNullOrWhiteSpace(request.Phone) || string.IsNullOrWhiteSpace(request.Password))
        {
            return UnprocessableEntity(new { message = "جميع الحقول الأساسية مطلوبة (الاسم الأول، الاسم الأخير، الجوال، كلمة المرور)" });
        }

        if (!string.IsNullOrEmpty(request.PasswordConfirmation) && request.Password != request.PasswordConfirmation)
        {
            return UnprocessableEntity(new { message = "تأكيد كلمة المرور غير متطابق" });
        }

        var normalizedPhone = _smsService.NormalizeYemeniPhone(request.Phone);
        if (normalizedPhone == null)
        {
            return UnprocessableEntity(new
            {
                message = "رقم الجوال اليمني غير صحيح. يجب أن يبدأ بـ 77 أو 73 أو 71 أو 70 ويتكون من 9 أرقام.",
                errors = new { phone = new[] { "رقم الجوال اليمني غير صحيح (مثال: 771234567)" } }
            });
        }

        var existingUser = await FindUserByPhoneAsync(normalizedPhone);
        if (existingUser != null && existingUser.EmailVerifiedAt != null)
        {
            return UnprocessableEntity(new
            {
                message = "رقم الجوال هذا مسجل مسبقاً، يرجى تسجيل الدخول.",
                errors = new { phone = new[] { "رقم الجوال هذا مسجل مسبقاً." } }
            });
        }

        var otp = GenerateSixDigitOtp();
        var smsResult = await _smsService.SendOtpAsync(normalizedPhone, otp, "register");
        if (!smsResult.Success)
        {
            return StatusCode(500, new { message = smsResult.Message });
        }

        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

        User user;
        if (existingUser != null)
        {
            existingUser.FirstName = request.FirstName;
            existingUser.LastName = request.LastName;
            existingUser.Name = $"{request.FirstName} {request.LastName}".Trim();
            existingUser.Phone = normalizedPhone;
            existingUser.Password = hashedPassword;
            existingUser.Address = request.Address;
            existingUser.City = request.City;
            existingUser.Country = request.Country;
            existingUser.PostalCode = request.PostalCode;
            existingUser.Role = "customer";
            existingUser.IsActive = true;
            existingUser.RememberToken = otp;
            existingUser.UpdatedAt = DateTime.UtcNow;
            user = existingUser;
        }
        else
        {
            var finalEmail = !string.IsNullOrWhiteSpace(request.Email)
                ? request.Email.Trim()
                : $"{normalizedPhone}@phone.local";
            user = new User
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Name = $"{request.FirstName} {request.LastName}".Trim(),
                Phone = normalizedPhone,
                Email = finalEmail,
                Password = hashedPassword,
                Address = request.Address,
                City = request.City,
                Country = request.Country,
                PostalCode = request.PostalCode,
                Role = "customer",
                IsActive = true,
                RememberToken = otp,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _db.Users.Add(user);
        }

        await _db.SaveChangesAsync();

        _cache.Set($"register_otp_{normalizedPhone}", otp, TimeSpan.FromMinutes(10));

        return StatusCode(201, new
        {
            requires_otp = true,
            phone = normalizedPhone,
            dev_otp = string.IsNullOrWhiteSpace(_config["QuickConnect:ApiKey"]) ? otp : null,
            message = "تم إرسال رمز التحقق (OTP) عبر الواتساب إلى رقم جوالك",
            user = new
            {
                id = user.Id,
                phone = user.Phone,
                name = user.Name
            }
        });
    }

    [HttpPost("verify-register-otp")]
    public async Task<IActionResult> VerifyRegisterOtp([FromBody] VerifyOtpRequest request)
    {
        var normalizedPhone = _smsService.NormalizeYemeniPhone(request.Phone) ?? request.Phone?.Trim() ?? "";
        var user = await FindUserByPhoneAsync(normalizedPhone);

        if (user == null)
        {
            return NotFound(new { message = "الحساب غير موجود، يرجى إعادة التسجيل" });
        }

        var cacheKey = $"register_otp_{normalizedPhone}";
        _cache.TryGetValue<string>(cacheKey, out var cachedOtp);
        var fallbackOtp = user.RememberToken;
        var inputOtp = request.Otp?.Trim() ?? "";

        var isValid = (!string.IsNullOrEmpty(cachedOtp) && cachedOtp == inputOtp)
                      || (string.IsNullOrEmpty(cachedOtp) && !string.IsNullOrEmpty(fallbackOtp) && fallbackOtp.Length == 6 && fallbackOtp == inputOtp);

        if (!isValid)
        {
            return UnprocessableEntity(new { message = "رمز التحقق غير صحيح أو منتهي الصلاحية" });
        }

        _cache.Remove(cacheKey);
        user.EmailVerifiedAt = DateTime.UtcNow;
        user.RememberToken = null;
        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user);

        return Ok(new
        {
            user = FormatUserPayload(user),
            token,
            message = "تم تفعيل حسابك وتسجيل الدخول بنجاح!"
        });
    }

    [HttpPost("resend-register-otp")]
    public async Task<IActionResult> ResendRegisterOtp([FromBody] ResendOtpRequest request)
    {
        var normalizedPhone = _smsService.NormalizeYemeniPhone(request.Phone);
        if (normalizedPhone == null)
        {
            return UnprocessableEntity(new { message = "رقم الجوال غير صحيح" });
        }

        var user = await FindUserByPhoneAsync(normalizedPhone);
        if (user == null)
        {
            return NotFound(new { message = "المستخدم غير موجود" });
        }

        var otp = GenerateSixDigitOtp();
        _cache.Set($"register_otp_{normalizedPhone}", otp, TimeSpan.FromMinutes(10));
        user.RememberToken = otp;
        await _db.SaveChangesAsync();

        var smsResult = await _smsService.SendOtpAsync(normalizedPhone, otp, "register");
        if (!smsResult.Success)
        {
            return StatusCode(500, new { message = smsResult.Message });
        }

        return Ok(new { message = "تم إعادة إرسال رمز التحقق إلى رقم جوالك بنجاح" });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var identifier = (request.Phone ?? request.Email ?? "").Trim();
        var password = request.Password ?? "";

        if (string.IsNullOrEmpty(identifier) || string.IsNullOrEmpty(password))
        {
            return UnprocessableEntity(new { message = "يرجى إدخال رقم الجوال وكلمة المرور" });
        }

        User? user;
        if (identifier.Contains('@'))
        {
            user = await _db.Users
                .FirstOrDefaultAsync(u => u.Email == identifier);
        }
        else
        {
            var normalizedPhone = _smsService.NormalizeYemeniPhone(identifier);
            if (normalizedPhone == null)
            {
                return UnprocessableEntity(new { message = "رقم الجوال اليمني غير صحيح (مثال: 771234567)" });
            }
            var variants = _smsService.GetPhoneVariants(normalizedPhone);
            user = await _db.Users
                .FirstOrDefaultAsync(u => u.Phone != null && variants.Contains(u.Phone));
        }

        if (user == null || !VerifyPassword(password, user.Password))
        {
            return Unauthorized(new { message = "رقم الجوال أو كلمة المرور غير صحيحة" });
        }

        if (!user.IsActive)
        {
            return StatusCode(403, new { message = "حسابك غير نشط، يرجى التواصل مع الدعم الفني" });
        }

        if (user.Role == "seller")
        {
            try
            {
                user.Seller = await _db.Sellers.AsNoTracking().FirstOrDefaultAsync(s => s.UserId == user.Id);
            }
            catch { }
        }

        var token = _jwtService.GenerateToken(user);

        return Ok(new
        {
            user = FormatUserPayload(user),
            token,
            message = "تم تسجيل الدخول بنجاح"
        });
    }

    [HttpPost("verify-login-otp")]
    public async Task<IActionResult> VerifyLoginOtp([FromBody] VerifyOtpRequest request)
    {
        var identifier = (request.Phone ?? request.Email ?? "").Trim();
        var normalizedPhone = _smsService.NormalizeYemeniPhone(identifier);
        var keySuffix = normalizedPhone ?? identifier;

        _cache.TryGetValue<string>($"login_otp_{keySuffix}", out var cachedOtp);
        if (string.IsNullOrEmpty(cachedOtp))
        {
            _cache.TryGetValue<string>($"register_otp_{keySuffix}", out cachedOtp);
        }

        var user = normalizedPhone != null
            ? await FindUserByPhoneAsync(normalizedPhone)
            : await _db.Users.Include(u => u.Seller).FirstOrDefaultAsync(u => u.Email == identifier);

        if (user == null)
        {
            return NotFound(new { message = "المستخدم غير موجود" });
        }

        var inputOtp = request.Otp?.Trim() ?? "";
        var isValid = (!string.IsNullOrEmpty(cachedOtp) && cachedOtp == inputOtp)
                      || (string.IsNullOrEmpty(cachedOtp) && !string.IsNullOrEmpty(user.RememberToken) && user.RememberToken.Length == 6 && user.RememberToken == inputOtp);

        if (!isValid)
        {
            return UnprocessableEntity(new { message = "رمز التحقق غير صحيح أو منتهي الصلاحية" });
        }

        _cache.Remove($"login_otp_{keySuffix}");
        _cache.Remove($"register_otp_{keySuffix}");

        user.EmailVerifiedAt ??= DateTime.UtcNow;
        user.RememberToken = null;
        await _db.SaveChangesAsync();

        var token = _jwtService.GenerateToken(user);

        return Ok(new
        {
            user = FormatUserPayload(user),
            token,
            message = "تم تسجيل الدخول بنجاح"
        });
    }

    [HttpPost("resend-login-otp")]
    public async Task<IActionResult> ResendLoginOtp([FromBody] ResendOtpRequest request)
    {
        var identifier = (request.Phone ?? request.Email ?? "").Trim();
        var normalizedPhone = _smsService.NormalizeYemeniPhone(identifier);

        var user = normalizedPhone != null
            ? await FindUserByPhoneAsync(normalizedPhone)
            : await _db.Users.FirstOrDefaultAsync(u => u.Email == identifier);

        if (user == null)
        {
            return NotFound(new { message = "المستخدم غير موجود" });
        }

        var otp = GenerateSixDigitOtp();
        var keySuffix = normalizedPhone ?? user.Email ?? identifier;
        _cache.Set($"login_otp_{keySuffix}", otp, TimeSpan.FromMinutes(10));
        user.RememberToken = otp;
        await _db.SaveChangesAsync();

        var targetPhone = normalizedPhone ?? user.Phone;
        if (!string.IsNullOrEmpty(targetPhone))
        {
            var smsResult = await _smsService.SendOtpAsync(targetPhone, otp, "login");
            if (!smsResult.Success)
            {
                return StatusCode(500, new { message = smsResult.Message });
            }
        }

        return Ok(new { message = "تم إعادة إرسال رمز التحقق بنجاح" });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ResendOtpRequest request)
    {
        var identifier = (request.Phone ?? request.Email ?? "").Trim();
        if (string.IsNullOrEmpty(identifier))
        {
            return UnprocessableEntity(new { message = "يرجى إدخال رقم الجوال" });
        }

        var otp = GenerateSixDigitOtp();

        if (!identifier.Contains('@'))
        {
            var normalizedPhone = _smsService.NormalizeYemeniPhone(identifier);
            if (normalizedPhone == null)
            {
                return UnprocessableEntity(new { message = "رقم الجوال اليمني غير صحيح" });
            }

            var user = await FindUserByPhoneAsync(normalizedPhone);
            if (user == null)
            {
                return NotFound(new { message = "لا يوجد حساب مسجل برقم الجوال هذا" });
            }

            _cache.Set($"reset_otp_{normalizedPhone}", otp, TimeSpan.FromMinutes(10));
            user.RememberToken = otp;
            await _db.SaveChangesAsync();

            var smsResult = await _smsService.SendOtpAsync(normalizedPhone, otp, "reset");
            if (!smsResult.Success)
            {
                return StatusCode(500, new { message = smsResult.Message });
            }

            return Ok(new
            {
                phone = normalizedPhone,
                message = "تم إرسال رمز إعادة تعيين كلمة المرور إلى رقم جوالك"
            });
        }

        var emailUser = await _db.Users.FirstOrDefaultAsync(u => u.Email == identifier);
        if (emailUser == null)
        {
            return NotFound(new { message = "البريد الإلكتروني غير مسجل" });
        }

        _cache.Set($"reset_otp_{emailUser.Email}", otp, TimeSpan.FromMinutes(10));
        emailUser.RememberToken = otp;
        await _db.SaveChangesAsync();

        return Ok(new { message = "تم إرسال رمز إعادة تعيين كلمة المرور" });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var identifier = (request.Phone ?? request.Email ?? "").Trim();
        if (string.IsNullOrEmpty(identifier) || string.IsNullOrEmpty(request.Token) || string.IsNullOrEmpty(request.Password))
        {
            return UnprocessableEntity(new { message = "رقم الجوال ورمز التحقق وكلمة المرور مطلوبة" });
        }

        var normalizedPhone = !identifier.Contains('@')
            ? _smsService.NormalizeYemeniPhone(identifier)
            : null;

        var user = normalizedPhone != null
            ? await FindUserByPhoneAsync(normalizedPhone)
            : await _db.Users.FirstOrDefaultAsync(u => u.Email == identifier);

        if (user == null)
        {
            return NotFound(new { message = "المستخدم غير موجود" });
        }

        var keySuffix = normalizedPhone ?? user.Email ?? identifier;
        _cache.TryGetValue<string>($"reset_otp_{keySuffix}", out var cachedOtp);
        var inputOtp = request.Token.Trim();

        var isValid = (!string.IsNullOrEmpty(cachedOtp) && cachedOtp == inputOtp)
                      || (string.IsNullOrEmpty(cachedOtp) && !string.IsNullOrEmpty(user.RememberToken) && user.RememberToken.Length == 6 && user.RememberToken == inputOtp);

        if (!isValid)
        {
            return UnprocessableEntity(new { message = "رمز التحقق غير صحيح أو منتهي الصلاحية" });
        }

        user.Password = BCrypt.Net.BCrypt.HashPassword(request.Password);
        user.RememberToken = null;
        user.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        _cache.Remove($"reset_otp_{keySuffix}");

        return Ok(new { message = "تم إعادة تعيين كلمة المرور بنجاح" });
    }

    [Authorize]
    [HttpGet("user")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!ulong.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var user = await _db.Users
            .Include(u => u.Seller)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return NotFound();
        }

        var ordersCount = await _db.Orders.CountAsync(o => o.UserId == user.Id);
        var wishlistCount = await _db.Wishlists.CountAsync(w => w.UserId == user.Id);
        var cleanEmail = (!string.IsNullOrEmpty(user.Email) && user.Email.EndsWith("@phone.local")) ? null : user.Email;

        return Ok(new
        {
            id = user.Id,
            first_name = user.FirstName,
            last_name = user.LastName,
            name = user.Name,
            email = cleanEmail,
            phone = user.Phone,
            address = user.Address,
            city = user.City,
            country = user.Country,
            postal_code = user.PostalCode,
            role = user.Role,
            is_active = user.IsActive,
            seller_status = user.Seller?.Status,
            stats = new
            {
                orders_count = ordersCount,
                wishlist_count = wishlistCount,
                coupons_count = 0
            }
        });
    }

    [Authorize]
    [HttpPut("user/profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!ulong.TryParse(userIdStr, out var userId))
        {
            return Unauthorized();
        }

        var user = await _db.Users.Include(u => u.Seller).FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
        {
            return NotFound();
        }

        if (!string.IsNullOrEmpty(request.NewPassword))
        {
            if (string.IsNullOrEmpty(request.CurrentPassword) || !VerifyPassword(request.CurrentPassword, user.Password))
            {
                return UnprocessableEntity(new { message = "كلمة المرور الحالية غير صحيحة" });
            }
            user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        }

        user.FirstName = request.FirstName;
        user.LastName = request.LastName;
        user.Name = $"{request.FirstName} {request.LastName}".Trim();

        if (!string.IsNullOrWhiteSpace(request.Phone))
        {
            user.Phone = _smsService.NormalizeYemeniPhone(request.Phone) ?? request.Phone;
        }

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            user.Email = request.Email;
        }

        user.Address = request.Address;
        user.City = request.City;
        user.Country = request.Country;
        user.PostalCode = request.PostalCode;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return Ok(new
        {
            user = FormatUserPayload(user),
            message = "تم تحديث الملف الشخصي بنجاح"
        });
    }

    [HttpPost("seller/register")]
    public async Task<IActionResult> RegisterSeller([FromForm] RegisterSellerFormRequest request)
    {
        User? user = null;
        string? token = null;

        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (ulong.TryParse(userIdStr, out var authUserId))
        {
            user = await _db.Users.Include(u => u.Seller).FirstOrDefaultAsync(u => u.Id == authUserId);
        }

        if (user == null)
        {
            var normalizedPhone = !string.IsNullOrWhiteSpace(request.Phone)
                ? _smsService.NormalizeYemeniPhone(request.Phone)
                : null;

            if (!string.IsNullOrWhiteSpace(request.Phone) && normalizedPhone == null)
            {
                return UnprocessableEntity(new { message = "رقم الجوال اليمني غير صحيح (مثال: 771234567)" });
            }

            if (normalizedPhone != null && await FindUserByPhoneAsync(normalizedPhone) != null)
            {
                return UnprocessableEntity(new { message = "رقم الجوال هذا مسجل مسبقاً، يرجى تسجيل الدخول أولاً ثم التقديم كبائع." });
            }

            user = new User
            {
                FirstName = request.FirstName,
                LastName = request.LastName,
                Name = $"{request.FirstName} {request.LastName}".Trim(),
                Phone = normalizedPhone,
                Email = !string.IsNullOrWhiteSpace(request.Email) ? request.Email : $"{normalizedPhone}@phone.local",
                EmailVerifiedAt = DateTime.UtcNow,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password ?? "12345678"),
                Role = "seller",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            token = _jwtService.GenerateToken(user);
        }
        else
        {
            if (user.Role != "admin" && user.Role != "seller")
            {
                user.Role = "seller";
                await _db.SaveChangesAsync();
            }
            token = _jwtService.GenerateToken(user);
        }

        var existingSeller = await _db.Sellers.FirstOrDefaultAsync(s => s.UserId == user.Id);
        if (existingSeller != null)
        {
            return BadRequest(new { message = "لقد قمت بتقديم طلب مسبقاً." });
        }

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        string? avatarUrl = null;
        string? idCardUrl = null;
        string? commercialRegisterUrl = null;
        string? signedContractUrl = null;

        if (request.AvatarFile != null)
            avatarUrl = await _fileStorage.SaveFileAsync(request.AvatarFile.OpenReadStream(), request.AvatarFile.FileName, "sellers", baseUrl);

        if (request.IdCardImageFile != null)
            idCardUrl = await _fileStorage.SaveFileAsync(request.IdCardImageFile.OpenReadStream(), request.IdCardImageFile.FileName, "sellers/documents", baseUrl);

        if (request.CommercialRegisterImageFile != null)
            commercialRegisterUrl = await _fileStorage.SaveFileAsync(request.CommercialRegisterImageFile.OpenReadStream(), request.CommercialRegisterImageFile.FileName, "sellers/documents", baseUrl);

        if (request.SignedContractImageFile != null)
            signedContractUrl = await _fileStorage.SaveFileAsync(request.SignedContractImageFile.OpenReadStream(), request.SignedContractImageFile.FileName, "sellers/documents", baseUrl);

        var seller = new Seller
        {
            UserId = user.Id,
            StoreName = request.StoreName,
            Description = request.Description,
            Address = request.Address,
            City = request.City,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Avatar = avatarUrl,
            AvatarImage = avatarUrl,
            IdCardImage = idCardUrl,
            CommercialRegisterImage = commercialRegisterUrl,
            SignedContractImage = signedContractUrl,
            KuraimiAccountName = request.KuraimiAccountName,
            KuraimiAccountNumber = request.KuraimiAccountNumber,
            AltNetworkName = request.AltNetworkName,
            AltRecipientName = request.AltRecipientName,
            AltRecipientPhone = request.AltRecipientPhone,
            Status = "pending",
            IsVerified = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _db.Sellers.Add(seller);
        await _db.SaveChangesAsync();

        user.Seller = seller;

        return StatusCode(201, new
        {
            message = "تم إنشاء المتجر بنجاح وطلبك قيد المراجعة.",
            seller,
            user = FormatUserPayload(user),
            token
        });
    }

    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new { message = "Logged out successfully" });
    }
}
