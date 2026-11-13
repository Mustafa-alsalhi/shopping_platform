using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyStore.Domain.Entities;

[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("name")]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [Column("first_name")]
    [MaxLength(255)]
    public string? FirstName { get; set; }

    [Column("last_name")]
    [MaxLength(255)]
    public string? LastName { get; set; }

    [Column("email")]
    [MaxLength(255)]
    public string? Email { get; set; }

    [Column("email_verified_at")]
    public DateTime? EmailVerifiedAt { get; set; }

    [JsonIgnore]
    [Column("password")]
    [MaxLength(255)]
    public string Password { get; set; } = string.Empty;

    [Column("phone")]
    [MaxLength(30)]
    public string? Phone { get; set; }

    [Column("role")]
    [MaxLength(50)]
    public string Role { get; set; } = "customer"; // customer, seller, driver, admin

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Column("address")]
    public string? Address { get; set; }

    [Column("city")]
    [MaxLength(255)]
    public string? City { get; set; }

    [NotMapped]
    public string? State { get; set; }

    [Column("country")]
    [MaxLength(255)]
    public string? Country { get; set; }

    [Column("postal_code")]
    [MaxLength(20)]
    public string? PostalCode { get; set; }

    [Column("is_online")]
    public bool IsOnline { get; set; } = false;

    [Column("work_zone")]
    [MaxLength(255)]
    public string? WorkZone { get; set; }

    [Column("latitude")]
    public decimal? Latitude { get; set; }

    [Column("longitude")]
    public decimal? Longitude { get; set; }

    [JsonIgnore]
    [Column("remember_token")]
    [MaxLength(100)]
    public string? RememberToken { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation Properties
    public Seller? Seller { get; set; }
    public Driver? Driver { get; set; }
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<Order> DriverOrders { get; set; } = new List<Order>();

    [NotMapped]
    public string? Avatar { get; set; }

    [NotMapped]
    public bool IsVerified
    {
        get => EmailVerifiedAt.HasValue;
        set { if (value && !EmailVerifiedAt.HasValue) EmailVerifiedAt = DateTime.UtcNow; }
    }

    [NotMapped]
    public Driver? DriverProfile
    {
        get => Driver;
        set => Driver = value;
    }

    [NotMapped]
    public string? SellerStatus => Seller?.Status;
}
