using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace MyStore.Domain.Entities;

[Table("payment_requests")]
public class PaymentRequest
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("order_id")]
    public ulong? OrderId { get; set; }

    [Column("user_id")]
    public ulong? UserId { get; set; }

    [Column("payment_method")]
    [MaxLength(100)]
    public string PaymentMethod { get; set; } = string.Empty;

    [Column("payment_method_name")]
    [MaxLength(255)]
    public string? PaymentMethodName { get; set; }

    [Column("payer_name")]
    [MaxLength(255)]
    public string? PayerName { get; set; }

    [Column("reference_number")]
    [MaxLength(255)]
    public string? ReferenceNumber { get; set; }

    [Column("phone_number")]
    [MaxLength(50)]
    public string? PhoneNumber { get; set; }

    [Column("payment_notes")]
    public string? PaymentNotes { get; set; }

    [Column("payment_image_path")]
    public string? PaymentImagePath { get; set; }

    [Column("payment_amount")]
    public decimal PaymentAmount { get; set; }

    [Column("payment_fee")]
    public decimal PaymentFee { get; set; } = 0;

    [Column("status")]
    [MaxLength(50)]
    public string Status { get; set; } = "pending"; // pending, approved, rejected

    [Column("admin_notes")]
    public string? AdminNotes { get; set; }

    [Column("payment_date")]
    public DateTime? PaymentDate { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    public Order? Order { get; set; }
    public User? User { get; set; }
}
