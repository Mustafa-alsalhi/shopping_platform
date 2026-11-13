using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyStore.Domain.Entities;

[Table("settings")]
public class Setting
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("store_name")]
    public string? StoreName { get; set; }

    [Column("store_description")]
    public string? StoreDescription { get; set; }

    [Column("store_logo")]
    public string? StoreLogo { get; set; }

    [Column("store_favicon")]
    public string? StoreFavicon { get; set; }

    [Column("store_email")]
    public string? StoreEmail { get; set; }

    [Column("store_phone")]
    public string? StorePhone { get; set; }

    [Column("store_address")]
    public string? StoreAddress { get; set; }

    [Column("facebook_url")]
    public string? FacebookUrl { get; set; }

    [Column("instagram_url")]
    public string? InstagramUrl { get; set; }

    [Column("twitter_url")]
    public string? TwitterUrl { get; set; }

    [Column("tiktok_url")]
    public string? TiktokUrl { get; set; }

    [Column("youtube_url")]
    public string? YoutubeUrl { get; set; }

    [Column("telegram_url")]
    public string? TelegramUrl { get; set; }

    [Column("whatsapp_url")]
    public string? WhatsappUrl { get; set; }

    [Column("site_name")]
    public string? SiteName { get; set; }

    [Column("site_language")]
    public string? SiteLanguage { get; set; } = "ar";

    [Column("timezone")]
    public string? Timezone { get; set; } = "Asia/Aden";

    [Column("date_format")]
    public string? DateFormat { get; set; } = "Y-m-d";

    [Column("time_format")]
    public string? TimeFormat { get; set; } = "H:i";

    [Column("allow_registration")]
    public bool AllowRegistration { get; set; } = true;

    [Column("allow_guest_checkout")]
    public bool AllowGuestCheckout { get; set; } = false;

    [Column("order_start_number")]
    public int? OrderStartNumber { get; set; }

    [Column("cancelled_order_retention_days")]
    public int? CancelledOrderRetentionDays { get; set; }

    [Column("default_order_status")]
    public string? DefaultOrderStatus { get; set; } = "pending";

    [Column("admin_notifications")]
    public bool AdminNotifications { get; set; } = true;

    [Column("customer_notifications")]
    public bool CustomerNotifications { get; set; } = true;

    [Column("seo_title")]
    public string? SeoTitle { get; set; }

    [Column("seo_description")]
    public string? SeoDescription { get; set; }

    [Column("seo_keywords")]
    public string? SeoKeywords { get; set; }

    [Column("analytics_code")]
    public string? AnalyticsCode { get; set; }

    [Column("products_per_section")]
    public int? ProductsPerSection { get; set; } = 8;

    [Column("homepage_sections")]
    public string? HomepageSections { get; set; } // JSON

    [Column("banner_settings")]
    public string? BannerSettings { get; set; } // JSON

    [Column("max_login_attempts")]
    public int? MaxLoginAttempts { get; set; } = 5;

    [Column("login_lockout_minutes")]
    public int? LoginLockoutMinutes { get; set; } = 15;

    [Column("maintenance_mode")]
    public bool MaintenanceMode { get; set; } = false;

    [Column("maintenance_message")]
    public string? MaintenanceMessage { get; set; }

    [Column("maintenance_admin_only")]
    public bool MaintenanceAdminOnly { get; set; } = true;

    [Column("delivery_zones")]
    public string? DeliveryZones { get; set; } // JSON

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;
}
