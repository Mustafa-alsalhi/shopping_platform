using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyStore.Domain.Entities;

[Table("coupons")]
public class Coupon
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("seller_id")]
    public ulong? SellerId { get; set; }

    [Column("code")]
    [MaxLength(100)]
    public string Code { get; set; } = string.Empty;

    [Column("name")]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("type")]
    [MaxLength(50)]
    public string Type { get; set; } = "percentage"; // percentage, fixed

    [Column("value")]
    public decimal Value { get; set; }

    [Column("minimum_amount")]
    public decimal? MinimumAmount { get; set; }

    [Column("maximum_discount")]
    public decimal? MaximumDiscount { get; set; }

    [Column("usage_limit")]
    public int? UsageLimit { get; set; }

    [Column("used_count")]
    public int UsedCount { get; set; } = 0;

    [Column("starts_at")]
    public DateTime? StartsAt { get; set; }

    [Column("expires_at")]
    public DateTime? ExpiresAt { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("is_first_time_only")]
    public bool IsFirstTimeOnly { get; set; } = false;

    [Column("applicable_products")]
    public string? ApplicableProducts { get; set; } // JSON array of product IDs

    [Column("applicable_categories")]
    public string? ApplicableCategories { get; set; } // JSON array of category IDs

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    public Seller? Seller { get; set; }

    [NotMapped]
    public decimal? MinOrderAmount { get => MinimumAmount; set => MinimumAmount = value; }

    [NotMapped]
    public int? MaxUses { get => UsageLimit; set => UsageLimit = value; }
}
