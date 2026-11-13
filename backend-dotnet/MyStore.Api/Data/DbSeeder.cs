using Microsoft.EntityFrameworkCore;
using MyStore.Domain.Entities;
using MyStore.Infrastructure.Persistence;

namespace MyStore.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        try
        {
            await db.Database.EnsureCreatedAsync();

            // 1. Ensure default Admin account exists
            if (!await db.Users.AnyAsync(u => u.Role == "admin"))
            {
                db.Users.Add(new User
                {
                    Name = "Admin User",
                    Email = "mustafaalsalhi065@gmail.com",
                    Password = BCrypt.Net.BCrypt.HashPassword("password"),
                    Role = "admin",
                    IsActive = true,
                    EmailVerifiedAt = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                await db.SaveChangesAsync();
            }

            // 2. Ensure default Store Settings exist
            if (!await db.Settings.AnyAsync())
            {
                db.Settings.Add(new Setting
                {
                    StoreName = "أصالة",
                    SiteName = "أصالة",
                    StoreDescription = "منصة أصالة للتسوق والمطاعم والتوصيل",
                    SiteLanguage = "ar",
                    Timezone = "Asia/Aden",
                    AllowRegistration = true,
                    AllowGuestCheckout = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                await db.SaveChangesAsync();
            }

            // 3. Ensure default Activities (Stores & Restaurants) exist
            if (!await db.Activities.AnyAsync())
            {
                db.Activities.AddRange(
                    new Activity
                    {
                        Name = "المتاجر والتسوق",
                        Slug = "stores",
                        Icon = "🛍️",
                        Description = "تسوق أفضل المنتجات من المتاجر المحلية",
                        PlaceLabel = "متجر",
                        ItemLabel = "منتج",
                        IsActive = true,
                        SortOrder = 1
                    },
                    new Activity
                    {
                        Name = "المطاعم والوجبات",
                        Slug = "restaurants",
                        Icon = "🍽️",
                        Description = "اطلب أشهى الوجبات من المطاعم القريبة",
                        PlaceLabel = "مطعم",
                        ItemLabel = "وجبة",
                        IsActive = true,
                        SortOrder = 2
                    }
                );
                await db.SaveChangesAsync();
            }

            // 4. Ensure default Payment Method exists
            if (!await db.PaymentMethods.AnyAsync())
            {
                db.PaymentMethods.Add(new PaymentMethod
                {
                    Name = "الدفع عند الاستلام",
                    Code = "cash_on_delivery",
                    Description = "ادفع نقداً عند استلام طلبك",
                    Fee = 0,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
                await db.SaveChangesAsync();
            }
        }
        catch (Exception ex)
        {
            var logger = scope.ServiceProvider.GetService<ILoggerFactory>()?.CreateLogger("DbSeeder");
            logger?.LogWarning(ex, "Database seeding skipped or encountered a non-fatal warning.");
        }
    }
}

