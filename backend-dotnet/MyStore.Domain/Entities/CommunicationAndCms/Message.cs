using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MyStore.Domain.Entities;

[Table("messages")]
public class Message
{
    [Key]
    [Column("id")]
    public ulong Id { get; set; }

    [Column("seller_id")]
    public ulong? SellerId { get; set; }

    [Column("customer_id")]
    public ulong? CustomerId { get; set; }

    [Column("customer_name")]
    [MaxLength(255)]
    public string? CustomerName { get; set; }

    [Column("customer_email")]
    [MaxLength(255)]
    public string? CustomerEmail { get; set; }

    [Column("customer_phone")]
    [MaxLength(50)]
    public string? CustomerPhone { get; set; }

    [Column("subject")]
    [MaxLength(255)]
    public string? Subject { get; set; }

    [Column("message")]
    public string MessageText { get; set; } = string.Empty;

    [Column("type")]
    [MaxLength(50)]
    public string Type { get; set; } = "general";

    [Column("priority")]
    [MaxLength(50)]
    public string Priority { get; set; } = "medium";

    [Column("status")]
    [MaxLength(50)]
    public string Status { get; set; } = "unread";

    [Column("reply")]
    public string? Reply { get; set; }

    [Column("replied_at")]
    public DateTime? RepliedAt { get; set; }

    [Column("read_at")]
    public DateTime? ReadAt { get; set; }

    [Column("order_id")]
    public ulong? OrderId { get; set; }

    [Column("product_id")]
    public ulong? ProductId { get; set; }

    [Column("attachments")]
    public string? Attachments { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; } = DateTime.UtcNow;

    public Seller? Seller { get; set; }
    public User? Customer { get; set; }
    public Order? Order { get; set; }
    public Product? Product { get; set; }
}
