using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyStore.Domain.Entities;

[Table("sellers")]
public class Seller
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("user_id")]
    public ulong? UserId { get; set; }

    [Column("store_name")]
    [MaxLength(255)]
    public string StoreName { get; set; } = string.Empty;

    [Column("description")]
    public string? Description { get; set; }

    [Column("avatar")]
    public string? Avatar { get; set; }

    [Column("avatar_image")]
    public string? AvatarImage { get; set; }

    [Column("cover_image")]
    public string? CoverImage { get; set; }

    [Column("type")]
    [MaxLength(50)]
    public string Type { get; set; } = "store"; // store, restaurant, or activity slug

    [Column("rating")]
    public decimal Rating { get; set; } = 0;

    [Column("reviews_count")]
    public int ReviewsCount { get; set; } = 0;

    [Column("status")]
    [MaxLength(50)]
    public string Status { get; set; } = "pending"; // pending, active, suspended, rejected

    [Column("is_verified")]
    public bool IsVerified { get; set; } = false;

    [Column("is_open")]
    public bool IsOpen { get; set; } = true;

    [Column("accepting_orders")]
    public bool AcceptingOrders { get; set; } = true;

    [Column("preparation_time")]
    [MaxLength(100)]
    public string? PreparationTime { get; set; } = "20-30 دقيقة";

    [Column("min_order_amount")]
    public decimal MinOrderAmount { get; set; } = 0;

    [Column("working_hours")]
    public string? WorkingHours { get; set; } // JSON string

    [Column("cuisine_type")]
    [MaxLength(100)]
    public string? CuisineType { get; set; }

    [Column("address")]
    [MaxLength(500)]
    public string? Address { get; set; }

    [Column("city")]
    [MaxLength(250)]
    public string? City { get; set; }

    [Column("latitude")]
    public decimal? Latitude { get; set; }

    [Column("longitude")]
    public decimal? Longitude { get; set; }

    // KYC & Finance fields
    [Column("id_card_image")]
    public string? IdCardImage { get; set; }

    [Column("commercial_register_image")]
    public string? CommercialRegisterImage { get; set; }

    [Column("signed_contract_image")]
    public string? SignedContractImage { get; set; }

    [Column("kuraimi_account_name")]
    [MaxLength(255)]
    public string? KuraimiAccountName { get; set; }

    [Column("kuraimi_account_number")]
    [MaxLength(255)]
    public string? KuraimiAccountNumber { get; set; }

    [Column("alt_network_name")]
    [MaxLength(255)]
    public string? AltNetworkName { get; set; }

    [Column("alt_recipient_name")]
    [MaxLength(255)]
    public string? AltRecipientName { get; set; }

    [Column("alt_recipient_phone")]
    [MaxLength(50)]
    public string? AltRecipientPhone { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public User? User { get; set; }
    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<SellerCategory> SellerCategories { get; set; } = new List<SellerCategory>();

    // Convenience Aliases
    [NotMapped]
    public string Name { get => StoreName; set => StoreName = value; }

    [NotMapped]
    public string? Logo { get => Avatar ?? AvatarImage; set { Avatar = value; AvatarImage = value; } }

    [NotMapped]
    public int ProductsCount { get; set; }

    [NotMapped]
    public string? DeliveryTime { get => PreparationTime; set => PreparationTime = value; }

    [NotMapped]
    public decimal DeliveryFee { get; set; } = 0;

    [NotMapped]
    public decimal MinimumOrder { get => MinOrderAmount; set => MinOrderAmount = value; }

    [NotMapped]
    public bool Featured { get => IsVerified; set => IsVerified = value; }

    [NotMapped]
    public bool Verified { get => IsVerified; set => IsVerified = value; }

    [NotMapped]
    public string? Email { get; set; }

    [NotMapped]
    public string? Phone { get => AltRecipientPhone; set => AltRecipientPhone = value; }

    [NotMapped]
    public string? PaymentMethods { get; set; }
}
