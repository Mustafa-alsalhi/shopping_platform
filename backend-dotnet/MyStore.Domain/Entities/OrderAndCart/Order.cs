using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyStore.Domain.Entities;

[Table("orders")]
public class Order
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("user_id")]
    public ulong UserId { get; set; }

    [Column("order_number")]
    [MaxLength(100)]
    public string OrderNumber { get; set; } = string.Empty;

    [Column("total_amount")]
    public decimal TotalAmount { get; set; }

    [Column("subtotal")]
    public decimal Subtotal { get; set; }

    [Column("tax")]
    public decimal Tax { get; set; } = 0;

    [Column("shipping")]
    public decimal Shipping { get; set; } = 0;

    [Column("status")]
    [MaxLength(50)]
    public string Status { get; set; } = "pending";

    [Column("payment_status")]
    [MaxLength(50)]
    public string PaymentStatus { get; set; } = "pending";

    [Column("payment_method")]
    [MaxLength(100)]
    public string? PaymentMethod { get; set; }

    [Column("shipping_company")]
    [MaxLength(255)]
    public string? ShippingCompany { get; set; }

    [Column("shipping_address")]
    public string ShippingAddress { get; set; } = "{}"; // JSON

    [Column("billing_address")]
    public string? BillingAddress { get; set; } // JSON

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("latitude")]
    public decimal? Latitude { get; set; }

    [Column("longitude")]
    public decimal? Longitude { get; set; }

    [Column("formatted_address")]
    public string? FormattedAddress { get; set; }

    [Column("building_details")]
    public string? BuildingDetails { get; set; }

    [Column("driver_id")]
    public ulong? DriverId { get; set; }

    [Column("driver_status")]
    [MaxLength(50)]
    public string? DriverStatus { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User? User { get; set; }
    public User? Driver { get; set; }
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    public ICollection<PaymentRequest> PaymentRequests { get; set; } = new List<PaymentRequest>();

    [NotMapped]
    public decimal Total { get => TotalAmount; set => TotalAmount = value; }

    [NotMapped]
    public string? SellerStatus { get; set; }

    [NotMapped]
    public string? DeliveryNotes { get => BuildingDetails; set => BuildingDetails = value; }

    [NotMapped]
    public string? DeliveryCode { get; set; }

    [NotMapped]
    public string? PreparationTime { get; set; }

    [NotMapped]
    public DateTime? DeliveredAt { get; set; }
}
